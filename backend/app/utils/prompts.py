"""Prompt template loader and assembler."""
import json
import os
from pathlib import Path
from typing import Dict, List


# Viewpoint templates (matching frontend viewpoint-templates.ts)
VIEWPOINT_MODIFIERS: Dict[str, str] = {
    "critical": """당신은 비판적 분석가입니다. 정보를 신중하게 검토하고, 
잠재적인 문제점, 모순, 또는 개선이 필요한 부분을 명확히 지적하세요. 
과장이나 선전에 속지 않고 사실에 기반한 비판적 시각을 유지하세요.""",
    
    "investor": """당신은 투자자 관점의 분석가입니다. 재무적 영향, 시장 동향, 
리스크와 기회를 중심으로 분석하세요. ROI, 성장 잠재력, 경쟁 우위 등을 평가하세요.""",
    
    "beginner": """당신은 초보자를 위한 설명자입니다. 전문 용어를 피하고, 
쉽고 이해하기 쉬운 언어로 설명하세요. 배경 지식이 없는 사람도 이해할 수 있도록 
단계별로 설명하고, 중요한 개념을 명확히 정의하세요.""",
    
    "fact": """당신은 사실 중심의 객관적 분석가입니다. 추측이나 의견보다는 
검증 가능한 사실과 데이터에 집중하세요. 출처를 명시하고, 주장과 사실을 구분하세요."""
}


def load_template(template_name: str) -> str:
    """
    Load prompt template from file.
    
    Args:
        template_name: Name of template file (e.g., "map_base.txt")
    
    Returns:
        Template content as string
    """
    template_dir = Path(__file__).parent.parent / "templates"
    template_path = template_dir / template_name
    
    if not template_path.exists():
        # Return default template if file doesn't exist
        if template_name == "map_base.txt":
            return """당신은 웹 콘텐츠 분석 전문가입니다. 주어진 URL의 콘텐츠를 분석하고,
사용자가 지정한 키워드와 관점에 따라 핵심 정보를 추출하세요."""
        elif template_name == "reduce_base.txt":
            return """당신은 여러 소스의 분석 결과를 통합하는 전문가입니다. 
개별 분석 결과를 종합하여 Executive Summary를 작성하세요. 
반드시 3개의 불릿 포인트로 요약하세요."""
    
    return template_path.read_text(encoding="utf-8")


def get_viewpoint_modifier(viewpoint: str) -> str:
    """
    Get viewpoint-specific prompt modifier.
    
    Args:
        viewpoint: Viewpoint key (critical, investor, beginner, fact)
    
    Returns:
        Viewpoint modifier text
    """
    return VIEWPOINT_MODIFIERS.get(viewpoint, VIEWPOINT_MODIFIERS["fact"])


def build_map_prompt(keywords: List[str], viewpoint: str) -> str:
    """
    Build Map phase prompt (individual source analysis).
    
    Args:
        keywords: User keywords (already sanitized)
        viewpoint: User viewpoint (already sanitized)
    
    Returns:
        Complete prompt string
    """
    base_template = load_template("map_base.txt")
    viewpoint_modifier = get_viewpoint_modifier(viewpoint)
    keywords_str = ", ".join(keywords)
    
    prompt = f"""{base_template}

{viewpoint_modifier}

**분석 지침:**
- 다음 키워드에 집중하세요: {keywords_str}
- 각 소스의 핵심 내용을 요약하세요
- 사용자 관점에 맞는 인사이트를 도출하세요
- 출처(URL)를 명시하세요

**출력 형식:**
- 간결하고 명확한 분석 (200-300자)
- 키워드와 관련된 핵심 내용 위주
"""
    
    return prompt


def build_reduce_prompt(keywords: List[str], viewpoint: str) -> str:
    """
    Build Reduce phase prompt (executive summary synthesis).
    
    Args:
        keywords: User keywords (already sanitized)
        viewpoint: User viewpoint (already sanitized)
    
    Returns:
        Complete prompt string
    """
    base_template = load_template("reduce_base.txt")
    viewpoint_modifier = get_viewpoint_modifier(viewpoint)
    keywords_str = ", ".join(keywords)
    
    prompt = f"""{base_template}

{viewpoint_modifier}

**통합 분석 지침:**
- 다음 키워드에 집중하세요: {keywords_str}
- 모든 소스의 분석 결과를 종합하세요
- 공통된 패턴이나 중요한 차이점을 찾으세요
- 사용자 관점에 맞는 최종 인사이트를 도출하세요

**출력 형식:**
- 반드시 정확히 3개의 불릿 포인트로 작성
- 각 불릿 포인트는 독립적이고 명확해야 함
- 각 불릿 포인트는 50-100자 이내
- 출처는 [Source: URL] 형식으로 명시

**제약사항:**
- 3개를 초과하거나 미만으로 작성하지 마세요
- 각 불릿 포인트는 핵심 인사이트를 담아야 합니다
"""
    
    return prompt


def build_action_item_prompt(keywords: List[str], viewpoint: str) -> str:
    """
    Build action item prompt.
    
    Args:
        keywords: User keywords (already sanitized)
        viewpoint: User viewpoint (already sanitized)
    
    Returns:
        Action item prompt string
    """
    viewpoint_modifier = get_viewpoint_modifier(viewpoint)
    keywords_str = ", ".join(keywords)
    
    prompt = f"""당신은 전략 컨설턴트입니다. 분석 결과를 바탕으로 사용자에게 
구체적인 행동 제안을 하세요.

{viewpoint_modifier}

**제안 지침:**
- 다음 키워드와 관련된 행동을 제안하세요: {keywords_str}
- 분석 결과에서 도출된 인사이트를 바탕으로 하세요
- 구체적이고 실행 가능한 제안을 하세요
- 사용자 관점에 맞는 제안을 하세요

**출력 형식:**
- 100-200자의 구체적인 행동 제안
- "해야 할 것", "고려할 것", "주의할 것" 등으로 구성
"""
    
    return prompt
