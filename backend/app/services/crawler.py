"""Web crawler service using Tavily API."""
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)


class CrawlerService:
    """Web crawler service using Tavily API."""
    
    def __init__(self):
        """Initialize crawler service."""
        self.api_key = settings.tavily_api_key
        self.base_url = "https://api.tavily.com"
        self.timeout = 10.0  # 10 seconds timeout
    
    async def crawl_url(self, url: str) -> Dict[str, Any]:
        """
        Crawl a single URL using Tavily API.
        
        Args:
            url: URL to crawl
        
        Returns:
            Dictionary with 'content', 'title', 'url', 'status'
        
        Raises:
            Exception: If crawling fails
        """
        if not self.api_key:
            logger.warning("Tavily API key not set, using fallback method")
            return await self._fallback_crawl(url)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/search",
                    json={
                        "api_key": self.api_key,
                        "query": url,
                        "search_depth": "basic",
                        "include_answer": True,
                        "include_raw_content": True,
                    },
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "url": url,
                    "content": data.get("answer", "") or data.get("content", ""),
                    "title": data.get("title", ""),
                    "status": "success",
                }
        except httpx.TimeoutException:
            logger.warning(f"Timeout crawling {url}")
            return {
                "url": url,
                "content": "",
                "title": "",
                "status": "failed",
                "error": "Timeout",
            }
        except Exception as e:
            logger.warning(f"Failed to crawl {url}: {e}")
            return {
                "url": url,
                "content": "",
                "title": "",
                "status": "failed",
                "error": str(e),
            }
    
    async def _fallback_crawl(self, url: str) -> Dict[str, Any]:
        """
        Fallback crawler using simple HTTP request.
        
        Args:
            url: URL to crawl
        
        Returns:
            Dictionary with crawled content
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, follow_redirects=True)

            # HTML 파싱하여 텍스트만 추출
            soup = BeautifulSoup(response.text, "html.parser")
            for script in soup(["script", "style"]):
                script.decompose()

            text = soup.get_text(separator=" ", strip=True)
            content = text[:5000]

            return {
                "url": url,
                "content": content,
                "title": "",
                "status": "success",
            }
        except Exception as e:
            logger.warning(f"Fallback crawl failed for {url}: {e}")
            return {
                "url": url,
                "content": "",
                "title": "",
                "status": "failed",
                "error": str(e),
            }
    
    async def crawl_multiple(self, urls: list[str]) -> list[Dict[str, Any]]:
        """
        Crawl multiple URLs in parallel.
        
        Args:
            urls: List of URLs to crawl
        
        Returns:
            List of crawl results
        """
        import asyncio
        
        tasks = [self.crawl_url(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Exception crawling {urls[i]}: {result}")
                processed_results.append({
                    "url": urls[i],
                    "content": "",
                    "title": "",
                    "status": "failed",
                    "error": str(result),
                })
            else:
                processed_results.append(result)
        
        return processed_results
