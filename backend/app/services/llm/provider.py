"""LLM provider abstraction layer for Gemini and OpenAI."""
from abc import ABC, abstractmethod
from typing import List, AsyncIterator
from langchain.schema import BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class BaseLLMService(ABC):
    """Abstract base class for LLM services."""
    
    @abstractmethod
    async def invoke(self, messages: List[BaseMessage]) -> str:
        """Invoke LLM with messages and return response."""
        pass
    
    @abstractmethod
    async def stream(self, messages: List[BaseMessage]) -> AsyncIterator[str]:
        """Stream LLM response."""
        pass


class GeminiLLMService(BaseLLMService):
    """Google Gemini LLM service using LangChain."""
    
    def __init__(self):
        """Initialize Gemini LLM service."""
        if not settings.google_api_key:
            raise ValueError("GOOGLE_GENERATIVE_AI_API_KEY is not set")
        
        self.llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            temperature=settings.llm_temperature,
            max_output_tokens=settings.llm_max_tokens,
            google_api_key=settings.google_api_key,
        )
        logger.info(f"Initialized Gemini service with model: {settings.gemini_model}")
    
    async def invoke(self, messages: List[BaseMessage]) -> str:
        """Invoke Gemini LLM."""
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"Gemini invocation failed: {e}")
            raise
    
    async def stream(self, messages: List[BaseMessage]) -> AsyncIterator[str]:
        """Stream Gemini LLM response."""
        try:
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            logger.error(f"Gemini streaming failed: {e}")
            raise


class OpenAILLMService(BaseLLMService):
    """OpenAI LLM service using LangChain."""
    
    def __init__(self):
        """Initialize OpenAI LLM service."""
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            api_key=settings.openai_api_key,
        )
        logger.info(f"Initialized OpenAI service with model: {settings.openai_model}")
    
    async def invoke(self, messages: List[BaseMessage]) -> str:
        """Invoke OpenAI LLM."""
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"OpenAI invocation failed: {e}")
            raise
    
    async def stream(self, messages: List[BaseMessage]) -> AsyncIterator[str]:
        """Stream OpenAI LLM response."""
        try:
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            raise


class LLMServiceFactory:
    """Factory for creating LLM services."""
    
    @staticmethod
    def create(provider: str = None) -> BaseLLMService:
        """
        Create LLM service based on provider.
        
        Args:
            provider: "gemini" or "openai". If None, uses settings.llm_provider
        
        Returns:
            LLM service instance
        
        Raises:
            ValueError: If provider is not supported
        """
        provider = provider or settings.llm_provider
        
        if provider.lower() == "gemini":
            return GeminiLLMService()
        elif provider.lower() == "openai":
            return OpenAILLMService()
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")


class LLMStrategy:
    """LLM strategy with fallback mechanism."""
    
    def __init__(self):
        """Initialize LLM strategy with primary and fallback."""
        self.primary_provider = settings.llm_provider
        self.fallback_provider = "openai" if self.primary_provider == "gemini" else "gemini"
    
    async def invoke_with_fallback(
        self,
        messages: List[BaseMessage],
        max_retries: int = 2,
    ) -> str:
        """
        Invoke LLM with fallback mechanism.
        
        Args:
            messages: List of LangChain messages
            max_retries: Maximum retry attempts
        
        Returns:
            LLM response string
        
        Raises:
            Exception: If both primary and fallback fail
        """
        last_error = None
        
        # Try primary provider
        try:
            service = LLMServiceFactory.create(self.primary_provider)
            return await service.invoke(messages)
        except Exception as e:
            logger.warning(f"Primary LLM ({self.primary_provider}) failed: {e}")
            last_error = e
        
        # Try fallback provider
        try:
            logger.info(f"Falling back to {self.fallback_provider}")
            service = LLMServiceFactory.create(self.fallback_provider)
            return await service.invoke(messages)
        except Exception as e:
            logger.error(f"Fallback LLM ({self.fallback_provider}) also failed: {e}")
            raise last_error or e
    
    async def invoke_by_complexity(
        self,
        messages: List[BaseMessage],
        complexity: str = "medium",
    ) -> str:
        """
        Invoke LLM based on task complexity.
        
        Args:
            messages: List of LangChain messages
            complexity: "simple", "medium", or "complex"
        
        Returns:
            LLM response string
        """
        if complexity == "simple":
            # Use faster, cheaper model
            provider = "gemini"  # Could use gemini-1.5-flash
        elif complexity == "medium":
            provider = settings.llm_provider
        else:  # complex
            provider = "openai"  # Use GPT-4o for complex tasks
        
        service = LLMServiceFactory.create(provider)
        return await service.invoke(messages)
