"""Report generator service using Map-Reduce pattern."""
from typing import List, Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm.provider import LLMStrategy
from app.services.crawler import CrawlerService
from app.utils.prompts import (
    build_map_prompt,
    build_reduce_prompt,
    build_action_item_prompt,
)
from app.utils.sanitize import sanitize_keywords, sanitize_viewpoint
from app.models.schemas import SourceAnalysis, ExecutiveSummary, ActionItem
import logging
import re

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Report generator service with Map-Reduce pattern."""
    
    def __init__(self):
        """Initialize report generator."""
        self.llm_strategy = LLMStrategy()
        self.crawler = CrawlerService()
    
    async def generate_report(
        self,
        sources: List[Dict[str, Any]],
        keywords: List[str],
        viewpoint: str,
    ) -> Dict[str, Any]:
        """
        Generate report using Map-Reduce pattern.
        
        Args:
            sources: List of source dictionaries with 'url' key
            keywords: User keywords (will be sanitized)
            viewpoint: User viewpoint (will be sanitized)
        
        Returns:
            Dictionary with 'executive_summary', 'sources', 'action_item'
        """
        # Sanitize inputs
        sanitized_keywords = sanitize_keywords(keywords)
        sanitized_viewpoint = sanitize_viewpoint(viewpoint)
        
        logger.info(f"Generating report with {len(sources)} sources, "
                    f"keywords: {sanitized_keywords}, viewpoint: {sanitized_viewpoint}")
        
        # Step 1: Crawl sources (parallel)
        logger.info("Step 1: Crawling sources...")
        crawled_sources = await self.crawler.crawl_multiple([s["url"] for s in sources])
        
        # Step 2: Map Phase - Analyze each source individually
        logger.info("Step 2: Map phase - Analyzing individual sources...")
        source_analyses = await self._map_phase(
            crawled_sources,
            sanitized_keywords,
            sanitized_viewpoint,
        )
        
        # Filter out failed analyses
        successful_analyses = [
            sa for sa in source_analyses
            if sa.status == "success" and sa.analysis
        ]
        
        if not successful_analyses:
            raise ValueError("All source analyses failed. Cannot generate report.")
        
        # Step 3: Reduce Phase - Generate executive summary
        logger.info("Step 3: Reduce phase - Generating executive summary...")
        executive_summary = await self._reduce_phase(
            successful_analyses,
            sanitized_keywords,
            sanitized_viewpoint,
        )
        
        # Step 4: Generate action item
        logger.info("Step 4: Generating action item...")
        action_item = await self._generate_action_item(
            successful_analyses,
            sanitized_keywords,
            sanitized_viewpoint,
        )
        
        return {
            "executive_summary": executive_summary.dict(),
            "sources": [sa.dict() for sa in source_analyses],
            "action_item": action_item.dict(),
        }
    
    async def _map_phase(
        self,
        crawled_sources: List[Dict[str, Any]],
        keywords: List[str],
        viewpoint: str,
    ) -> List[SourceAnalysis]:
        """
        Map phase: Analyze each source individually.
        
        Args:
            crawled_sources: List of crawled source data
            keywords: Sanitized keywords
            viewpoint: Sanitized viewpoint
        
        Returns:
            List of SourceAnalysis objects
        """
        import asyncio
        
        prompt = build_map_prompt(keywords, viewpoint)
        
        async def analyze_source(source: Dict[str, Any]) -> SourceAnalysis:
            """Analyze a single source."""
            if source.get("status") != "success" or not source.get("content"):
                return SourceAnalysis(
                    url=source["url"],
                    analysis=None,
                    status="failed",
                    error=source.get("error", "Crawl failed"),
                )
            
            try:
                messages = [
                    SystemMessage(content=prompt),
                    HumanMessage(
                        content=f"URL: {source['url']}\n\n"
                                f"Title: {source.get('title', 'N/A')}\n\n"
                                f"Content:\n{source['content']}"
                    ),
                ]
                
                analysis = await self.llm_strategy.invoke_with_fallback(messages)
                
                return SourceAnalysis(
                    url=source["url"],
                    analysis=analysis,
                    status="success",
                )
            except Exception as e:
                logger.warning(f"Source analysis failed for {source['url']}: {e}")
                return SourceAnalysis(
                    url=source["url"],
                    analysis=None,
                    status="failed",
                    error=str(e),
                )
        
        # Process in parallel
        tasks = [analyze_source(source) for source in crawled_sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        analyses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Exception analyzing source {crawled_sources[i]['url']}: {result}")
                analyses.append(SourceAnalysis(
                    url=crawled_sources[i]["url"],
                    analysis=None,
                    status="failed",
                    error=str(result),
                ))
            else:
                analyses.append(result)
        
        return analyses
    
    async def _reduce_phase(
        self,
        source_analyses: List[SourceAnalysis],
        keywords: List[str],
        viewpoint: str,
    ) -> ExecutiveSummary:
        """
        Reduce phase: Generate executive summary from all analyses.
        
        Args:
            source_analyses: List of successful source analyses
            keywords: Sanitized keywords
            viewpoint: Sanitized viewpoint
        
        Returns:
            ExecutiveSummary with exactly 3 bullets
        """
        prompt = build_reduce_prompt(keywords, viewpoint)
        
        # Combine all analyses
        combined_analyses = "\n\n".join([
            f"[Source: {sa.url}]\n{sa.analysis}"
            for sa in source_analyses
            if sa.analysis
        ])
        
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=combined_analyses),
        ]
        
        summary_text = await self.llm_strategy.invoke_with_fallback(messages)
        
        # Extract bullets
        bullets = self._extract_bullets(summary_text)
        
        # Self-correction if not exactly 3 bullets
        if len(bullets) != 3:
            bullets = await self._self_correct_summary(bullets, keywords, viewpoint)
        
        return ExecutiveSummary(bullets=bullets[:3])
    
    def _extract_bullets(self, text: str) -> List[str]:
        """
        Extract bullet points from text.
        
        Args:
            text: Text containing bullets
        
        Returns:
            List of bullet point strings
        """
        # Try to find bullet patterns
        patterns = [
            r'[-•*]\s*(.+?)(?=\n[-•*]|\n\n|$)',
            r'\d+[.)]\s*(.+?)(?=\n\d+[.)]|\n\n|$)',
            r'^(.+?)$',  # Fallback: each line
        ]
        
        bullets = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            if matches and len(matches) >= 3:
                bullets = [m.strip() for m in matches if m.strip()]
                break
        
        # If no pattern found, split by newlines
        if not bullets:
            bullets = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Clean bullets
        cleaned_bullets = []
        for bullet in bullets:
            # Remove leading markers
            bullet = re.sub(r'^[-•*]\s*', '', bullet)
            bullet = re.sub(r'^\d+[.)]\s*', '', bullet)
            if bullet and len(bullet) > 10:  # Minimum length
                cleaned_bullets.append(bullet)
        
        return cleaned_bullets[:10]  # Limit to 10 for self-correction
    
    async def _self_correct_summary(
        self,
        bullets: List[str],
        keywords: List[str],
        viewpoint: str,
    ) -> List[str]:
        """
        Self-correct summary to exactly 3 bullets.
        
        Args:
            bullets: Current bullets (may not be 3)
            keywords: Sanitized keywords
            viewpoint: Sanitized viewpoint
        
        Returns:
            List of exactly 3 bullets
        """
        correction_prompt = f"""다음 요약을 정확히 3개의 불릿 포인트로 압축하세요.
각 불릿 포인트는 핵심 인사이트를 담아야 합니다.

현재 요약:
{chr(10).join(f'- {b}' for b in bullets)}

관점: {viewpoint}
키워드: {', '.join(keywords)}

**요구사항:**
- 정확히 3개의 불릿 포인트만 작성
- 각 불릿 포인트는 50-100자 이내
- 핵심 인사이트만 포함
- 번호나 불릿 마커 없이 텍스트만 작성
"""
        
        messages = [
            SystemMessage(content=correction_prompt),
        ]
        
        corrected = await self.llm_strategy.invoke_with_fallback(messages)
        corrected_bullets = self._extract_bullets(corrected)
        
        # Ensure exactly 3
        if len(corrected_bullets) < 3:
            # Pad with empty strings if needed (shouldn't happen)
            while len(corrected_bullets) < 3:
                corrected_bullets.append("")
        elif len(corrected_bullets) > 3:
            # Take first 3
            corrected_bullets = corrected_bullets[:3]
        
        return corrected_bullets[:3]
    
    async def _generate_action_item(
        self,
        source_analyses: List[SourceAnalysis],
        keywords: List[str],
        viewpoint: str,
    ) -> ActionItem:
        """
        Generate action item recommendation.
        
        Args:
            source_analyses: List of successful source analyses
            keywords: Sanitized keywords
            viewpoint: Sanitized viewpoint
        
        Returns:
            ActionItem object
        """
        prompt = build_action_item_prompt(keywords, viewpoint)
        
        # Combine analyses for context
        combined_context = "\n\n".join([
            f"[Source: {sa.url}]\n{sa.analysis}"
            for sa in source_analyses
            if sa.analysis
        ])
        
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=f"분석 결과:\n\n{combined_context}"),
        ]
        
        action_text = await self.llm_strategy.invoke_with_fallback(messages)
        
        return ActionItem(
            text=action_text.strip(),
            perspective=viewpoint,
        )
