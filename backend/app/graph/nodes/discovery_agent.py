"""
@fileoverview OpenPath Component
@module app/graph/nodes/discovery_agent
@description Implements Node B: Repository Discovery Agent using Groq. Finds open-source repositories matching the user's profile.
@dependencies [app.core.state, langchain_groq]
@stateConsumed [profile, preferences]
@stateProduced [discovered_repos]
"""
import json
from typing import Dict, Any
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.core.state import OpenPathState

async def discovery_agent_node(state: OpenPathState) -> Dict[str, Any]:
    """
    Node B: Finds open-source repositories that match the user's profile and preferences.
    """
    profile = state.get("profile")
    preferences = state.get("preferences") or {}
    
    if not profile:
        preferences = state.get("preferences") or {}
    
    # 1. Fetch real repositories using MCP
    technologies = preferences.get("technologies", [])
    lang_query = " ".join([f"language:{lang}" for lang in technologies]) if technologies else ""
    # We search for repos with the given language, and some good first issues.
    query = f"{lang_query} good-first-issues:>0 stars:>10 sort:stars-desc".strip()
    
    from app.mcp.github_client import get_github_mcp_client
    
    try:
        async with get_github_mcp_client() as session:
            result = await session.call_tool("search_repositories", {"query": query, "perPage": 5})
            repos_data_str = "".join([c.text for c in result.content if hasattr(c, 'text')])
    except Exception as e:
        print(f"Error fetching repos via MCP: {e}")
        repos_data_str = "[]"

    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7)
    
    prompt = PromptTemplate(
        template="""You are an open-source mentor. Based on the following real GitHub repository search results,
        select exactly 2 repositories that best fit the user profile and their specific preferences.
        
        CRITICAL: You MUST select repositories from the provided Search Results. If the results are empty, provide fallback suggestions that strictly match the User Preferences (e.g., if they ask for Rust and Go, you MUST only suggest Rust and Go repositories).
        
        GitHub Search Results:
        {search_results}
        
        User Profile:
        {profile}
        
        User Preferences (Interests, Issue Types, etc.):
        {preferences}
        
        Respond ONLY with a valid JSON array of objects. Each object should have 'repo_name' (e.g., 'owner/repo'), 'description', and 'primary_language'.
        """,
        input_variables=["search_results", "profile", "preferences"],
    )
    
    chain = prompt | llm | JsonOutputParser()
    try:
        discovered_repos = await chain.ainvoke({
            "search_results": repos_data_str,
            "profile": json.dumps(profile),
            "preferences": json.dumps(preferences)
        })
    except Exception:
        discovered_repos = []
        
    return {"discovered_repos": discovered_repos}
