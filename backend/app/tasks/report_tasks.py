"""Celery tasks for report generation."""
from celery import Task
from celery_app import celery_app
from app.services.report_generator import ReportGenerator
from app.models.schemas import ConfigSnapshot
from app.config import settings
from supabase import create_client, Client
import logging
import json

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Get Supabase client with service role key."""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_report_task(
    self: Task,
    report_id: str,
    user_id: str,
    config: dict,
):
    """
    Generate report asynchronously.
    
    Args:
        report_id: Report ID in database
        user_id: User ID
        config: Configuration snapshot dictionary
    """
    import asyncio
    
    try:
        # Update status to collecting
        supabase = get_supabase_client()
        supabase.table("reports").update({
            "status": "collecting",
        }).eq("id", report_id).execute()
        
        # Parse config
        config_snapshot = ConfigSnapshot(**config)
        
        # Run async report generation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            generator = ReportGenerator()
            
            # Update status to analyzing
            supabase.table("reports").update({
                "status": "analyzing",
            }).eq("id", report_id).execute()
            
            # Generate report
            result = loop.run_until_complete(
                generator.generate_report(
                    sources=[{"url": s.url} for s in config_snapshot.sources],
                    keywords=config_snapshot.keywords,
                    viewpoint=config_snapshot.viewpoint,
                )
            )
            
            # Update status to synthesizing
            supabase.table("reports").update({
                "status": "synthesizing",
            }).eq("id", report_id).execute()
            
            # Save report sections
            for i, source_analysis in enumerate(result["sources"]):
                if source_analysis["status"] == "success":
                    supabase.table("report_sections").insert({
                        "report_id": report_id,
                        "url": source_analysis["url"],
                        "content": source_analysis.get("analysis", ""),
                        "status": "success",
                        "sort_order": i,
                    }).execute()
                else:
                    supabase.table("report_sections").insert({
                        "report_id": report_id,
                        "url": source_analysis["url"],
                        "content": None,
                        "status": "failed",
                        "sort_order": i,
                    }).execute()
            
            # Determine final status
            successful_sections = sum(
                1 for s in result["sources"]
                if s["status"] == "success"
            )
            total_sections = len(result["sources"])
            
            final_status = "completed"
            if successful_sections < total_sections and successful_sections > 0:
                final_status = "partial"
            elif successful_sections == 0:
                final_status = "failed"
            
            # Update report with final results
            supabase.table("reports").update({
                "status": final_status,
                "executive_summary": result["executive_summary"],
                "action_item": result["action_item"],
                "completed_at": "now()",
            }).eq("id", report_id).execute()
            
            logger.info(f"Report {report_id} generated successfully with status {final_status}")
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Report generation failed for {report_id}: {e}", exc_info=True)
        
        # Update status to failed
        try:
            supabase = get_supabase_client()
            supabase.table("reports").update({
                "status": "failed",
            }).eq("id", report_id).execute()
        except Exception as update_error:
            logger.error(f"Failed to update report status: {update_error}")
        
        # Retry if not exceeded max retries
        raise self.retry(exc=e, countdown=60)
