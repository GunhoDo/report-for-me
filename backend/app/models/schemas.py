"""Pydantic schemas for API request/response."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ConfigSnapshotSource(BaseModel):
    """Source configuration snapshot."""
    source_id: Optional[str] = None
    url: str
    status: str  # "valid" | "failed"
    crawled_at: Optional[str] = None


class ConfigSnapshot(BaseModel):
    """Configuration snapshot at report generation time."""
    keywords: List[str]
    viewpoint: str
    schedule_cron: Optional[str] = None
    sources: List[ConfigSnapshotSource]
    metadata: Optional[Dict[str, Any]] = None


class ReportGenerateRequest(BaseModel):
    """Request schema for report generation."""
    report_id: str
    user_id: str
    config: ConfigSnapshot


class SourceAnalysis(BaseModel):
    """Individual source analysis result."""
    url: str
    analysis: Optional[str] = None
    status: str  # "success" | "failed"
    error: Optional[str] = None


class ExecutiveSummary(BaseModel):
    """Executive summary with strict 3-bullet constraint."""
    bullets: List[str] = Field(..., max_length=3, description="Exactly 3 bullet points")


class ActionItem(BaseModel):
    """Action item recommendation."""
    text: str
    perspective: Optional[str] = None


class AnalysisReport(BaseModel):
    """Complete analysis report structure."""
    summary: ExecutiveSummary = Field(..., description="Executive summary, strictly 3 bullet points")
    sources: List[SourceAnalysis]
    action_item: ActionItem


class ReportStatusResponse(BaseModel):
    """Report status response."""
    report_id: str
    status: str
    progress: Optional[Dict[str, Any]] = None
