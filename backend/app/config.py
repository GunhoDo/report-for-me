"""Application configuration from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env.local from project root
env_path = Path(__file__).parent.parent.parent / ".env.local"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    # Fallback to current directory
    load_dotenv(dotenv_path=".env.local")


class Settings:
    """Application settings loaded from environment variables."""
    
    def __init__(self):
        # Supabase Configuration
        self.supabase_url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
        self.supabase_anon_key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
        self.supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE", "")
        self.supabase_project_id: str = os.getenv("SUPERBASE_PROJECT_ID", "")
        
        # LLM Configuration
        self.llm_provider: str = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" or "openai"
        self.google_api_key: str = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY", "")
        self.openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
        
        # Model Configuration
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
        self.openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o")
        
        # LLM Parameters
        self.llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.llm_max_tokens: int = int(os.getenv("LLM_MAX_TOKENS", "2000"))
        
        # Backend API Configuration
        self.backend_api_url: str = os.getenv("BACKEND_API_URL", "http://localhost:8000")
        
        # Celery Configuration
        self.celery_broker_url: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
        self.celery_result_backend: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
        
        # External APIs
        self.tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")


settings = Settings()
