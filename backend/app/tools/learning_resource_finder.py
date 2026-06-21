"""
@fileoverview OpenPath Component
@module app/tools/learning_resource_finder
@description Custom tool for pulling live tutorials and learning resources using Tavily API.
@dependencies [httpx, app.core.config]
@stateConsumed []
@stateProduced []
"""
import httpx
from typing import List, Dict, Any
from app.core.config import settings

async def find_learning_resources(topic: str, framework: str) -> List[Dict[str, Any]]:
    """
    Searches the web for live tutorials and learning resources based on the given topic and framework.
    Uses Tavily API to fetch accurate and up-to-date links.
    """
    if not settings.TAVILY_API_KEY:
        return [{"title": "Tavily API Key missing", "url": "", "content": "Configure TAVILY_API_KEY in .env to get live results."}]

    query = f"{framework} {topic} tutorial example best practices"
    url = "https://api.tavily.com/search"
    
    payload = {
        "api_key": settings.TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "max_results": 5
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "content": item.get("content", "")
                })
            return results
    except Exception as e:
        return [{"title": "Search failed", "url": "", "content": f"Error fetching resources: {str(e)}"}]
