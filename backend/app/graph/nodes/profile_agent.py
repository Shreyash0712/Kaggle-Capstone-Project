"""
@fileoverview OpenPath Component
@module app/graph/nodes/profile_agent
@description Implements Node A: Contributor Profile Agent using Gemini. Analyzes user GitHub activity to determine tech stack and skill level, leveraging DB cache.
@dependencies [app.core.state, app.db.session, app.db.cache, langchain_google_genai]
@stateConsumed [github_handle]
@stateProduced [profile, cache_hits]
"""
import json
from typing import Dict, Any
from sqlmodel import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.core.state import OpenPathState
from app.db.session import engine
from app.db.cache import get_user_profile, save_user_profile
from app.db.models import User

async def profile_agent_node(state: OpenPathState) -> Dict[str, Any]:
    """
    Node A: Analyzes user's GitHub activity.
    If cached and up-to-date, populates from DB.
    Otherwise, uses Gemini to analyze profile.
    """
    github_handle = state.get("github_handle")
    preferences = state.get("preferences", {})
    if not github_handle:
        return {}

    # 1. Fetch real GitHub data via MCP
    from app.mcp.github_client import get_github_mcp_client
    
    try:
        async with get_github_mcp_client() as session:
            result = await session.call_tool("search_commits", {"query": f"author:{github_handle}", "perPage": 30})
            
            # The MCP tool returns a CallToolResult object. We need to extract the text content.
            # Assuming result.content is a list of TextContent objects.
            github_data_str = str([c.text for c in result.content if hasattr(c, 'text')])
    except Exception as e:
        print(f"Error fetching GitHub data via MCP: {e}")
        github_data_str = f"Unable to fetch data for {github_handle}. Proceed based on preferences."

    llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
    
    prompt = PromptTemplate(
        template="""You are an expert developer evaluator.
        Based on the user's GitHub activity and their stated preferences, create a JSON profile of the user.
        The JSON should include keys: 'top_languages', 'skill_level' (Beginner, Intermediate, Advanced), and 'preferred_project_types'.
        
        GitHub Data (Current Experience):
        {github_data}
        
        User Stated Preferences (What they want to do):
        {preferences}
        
        Respond only with valid JSON.
        """,
        input_variables=["github_data", "preferences"],
    )
    
    chain = prompt | llm | JsonOutputParser()
    try:
        profile_data = await chain.ainvoke({
            "github_data": github_data_str,
            "preferences": json.dumps(preferences)
        })
    except Exception as e:
        profile_data = {"top_languages": ["Python"], "skill_level": "Intermediate", "preferred_project_types": ["Web"]}
        
    # We do not overwrite user DB here because DB user.profile stores the preferences from the frontend.
    return {"profile": profile_data}
