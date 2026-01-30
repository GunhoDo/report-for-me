"""Input sanitization utilities to prevent prompt injection."""
import re
from typing import List


def sanitize_keywords(keywords: List[str]) -> List[str]:
    """
    Sanitize user keywords to prevent prompt injection.
    
    Args:
        keywords: List of user-provided keywords
    
    Returns:
        Sanitized keywords list
    
    Raises:
        ValueError: If keywords contain dangerous patterns
    """
    sanitized = []
    dangerous_patterns = [
        r"system\s*:",
        r"user\s*:",
        r"assistant\s*:",
        r"ignore\s+previous",
        r"forget\s+all",
        r"you\s+are\s+now",
        r"act\s+as",
        r"pretend\s+to\s+be",
    ]
    
    for keyword in keywords:
        if not keyword or not keyword.strip():
            continue
        
        # Check for dangerous patterns (case-insensitive)
        keyword_lower = keyword.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, keyword_lower):
                raise ValueError(f"Keyword contains potentially dangerous pattern: {keyword}")
        
        # Remove excessive whitespace and special characters
        cleaned = re.sub(r'\s+', ' ', keyword.strip())
        # Allow alphanumeric, Korean characters, spaces, and common punctuation
        cleaned = re.sub(r'[^\w\s가-힣.,!?\-]', '', cleaned)
        
        if cleaned:
            sanitized.append(cleaned)
    
    return sanitized


def sanitize_viewpoint(viewpoint: str) -> str:
    """
    Sanitize viewpoint selection.
    
    Args:
        viewpoint: User-selected viewpoint
    
    Returns:
        Sanitized viewpoint
    
    Raises:
        ValueError: If viewpoint is invalid
    """
    valid_viewpoints = ["critical", "investor", "beginner", "fact"]
    
    if viewpoint not in valid_viewpoints:
        raise ValueError(f"Invalid viewpoint: {viewpoint}. Must be one of {valid_viewpoints}")
    
    return viewpoint
