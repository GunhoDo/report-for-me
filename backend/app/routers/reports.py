"""Report generation API endpoints."""
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ReportGenerateRequest, ReportStatusResponse
from app.tasks.report_tasks import generate_report_task
from celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_report(request: ReportGenerateRequest):
    """
    Trigger report generation asynchronously.
    
    Args:
        request: Report generation request with report_id, user_id, and config
    
    Returns:
        Response with report_id and task_id
    """
    try:
        # Enqueue Celery task
        task = generate_report_task.delay(
            report_id=request.report_id,
            user_id=request.user_id,
            config=request.config.dict(),
        )
        
        logger.info(f"Report generation task enqueued: {task.id} for report {request.report_id}")
        
        return {
            "report_id": request.report_id,
            "task_id": task.id,
            "status": "accepted",
        }
    except Exception as e:
        logger.error(f"Failed to enqueue report generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start report generation: {str(e)}",
        )


@router.get("/{report_id}/status", response_model=ReportStatusResponse)
async def get_report_status(report_id: str):
    """
    Get report generation status.
    
    Args:
        report_id: Report ID
    
    Returns:
        Report status response
    """
    try:
        # Check Celery task status
        # Note: This is a simplified version. In production, you'd want to
        # query the database directly for more accurate status.
        
        # For now, return a basic response
        # In production, query Supabase for actual status
        return ReportStatusResponse(
            report_id=report_id,
            status="pending",
        )
    except Exception as e:
        logger.error(f"Failed to get report status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get report status: {str(e)}",
        )
