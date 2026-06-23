"""
Centralized LLM initialization.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from core.config import settings

def get_llm():
    """
    Dynamically instantiate the LLM based on configuration,
    ensuring AI service modularity as per AGENTS.md rules.
    """
    if settings.ACTIVE_LLM_PROVIDER == "groq" and settings.GROQ_API_KEY:
        return ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY)
    
    # Default to Gemini 2.5 Flash as requested
    kwargs = {"model": "gemini-2.5-flash"}
    if settings.GEMINI_API_KEY:
        kwargs["api_key"] = settings.GEMINI_API_KEY
        
    return ChatGoogleGenerativeAI(**kwargs)
