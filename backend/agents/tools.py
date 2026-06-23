"""
Shared tools for Aletheox agents.
"""
from langchain_core.tools import tool
from tavily import TavilyClient
from core.config import settings

@tool
def search_web(query: str) -> str:
    """Search the web for real-world facts, statistics, or data to ground arguments and identify risks."""
    if not settings.TAVILY_API_KEY:
        return "Tavily API key not configured. Cannot perform search. Please rely on your internal knowledge."
    
    try:
        client = TavilyClient(api_key=settings.TAVILY_API_KEY)
        response = client.search(query, max_results=3)
        results = [f"Source: {r.get('title', 'Unknown Title')} ({r.get('url', '')})\nContent: {r.get('content', '')}" for r in response.get('results', [])]
        return "\n\n---\n\n".join(results)
    except Exception as e:
        return f"Search failed with error: {str(e)}"
