"""
@fileoverview OpenPath Component
@module app/graph/nodes/learning_gap_agent
@description Implements Node C2: Learning Gap Agent using Gemini. Compares user profile against issue requirements to identify knowledge gaps, leveraging DB cache.
@dependencies [app.core.state, app.db.session, app.db.cache, langchain_google_genai]
@stateConsumed [github_handle, profile, selected_issue, skills_context]
@stateProduced [learning_gaps, cache_hits]
"""
import json
from typing import Dict, Any
from sqlmodel import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.core.state import OpenPathState
from app.db.session import engine
from app.db.cache import get_learning_gaps_cache, save_learning_gaps
from app.db.models import LearningGapsCache

async def learning_gap_agent_node(state: OpenPathState) -> Dict[str, Any]:
    """
    Node C2: Compares profile against issue requirements to find gaps.
    Checks DB cache based on composite key (user_handle + issue_hash).
    """
    profile = state.get("profile")
    github_handle = state.get("github_handle")
    selected_issue = state.get("selected_issue")
    skills_context = state.get("skills_context") or ""
    
    if not profile or not github_handle or not selected_issue:
        return {"learning_gaps": []}
        
    issue_hash = selected_issue.get("hash", "unknown_hash")
    composite_key = f"{github_handle}_{issue_hash}"

    # 1. Check Cache
    with Session(engine) as session:
        cached_gaps = get_learning_gaps_cache(session, composite_key)
        
        if cached_gaps and cached_gaps.gaps:
            return {
                "learning_gaps": cached_gaps.gaps.get("gaps", []),
                "cache_hits": ["Node C2: Learning Gap Agent (DB Cache)"]
            }

        # 2. Cache Miss - Execute LLM Logic
        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.2)
        
        prompt = PromptTemplate(
            template="""You are an expert programming mentor.
            Compare the user's profile with the details of the selected issue.
            Identify up to 3 learning gaps (topics the user needs to study to solve the issue).
            
            Use the provided Domain Expert Skills Context to better understand what specific knowledge is required.
            
            User Profile:
            {profile}
            
            Selected Issue:
            {issue}
            
            Expert Skills Context:
            {skills_context}
            
            Respond strictly with valid JSON containing a single key 'gaps', which is an array of strings.
            """,
            input_variables=["profile", "issue", "skills_context"],
        )
        
        chain = prompt | llm | JsonOutputParser()
        try:
            result = await chain.ainvoke({
                "profile": json.dumps(profile),
                "issue": json.dumps(selected_issue),
                "skills_context": skills_context
            })
            gaps = result.get("gaps", [])
        except Exception as e:
            gaps = ["Unable to parse learning gaps."]
        
        # 3. Save to Cache
        new_cache = LearningGapsCache(
            user_handle_issue_hash=composite_key,
            gaps={"gaps": gaps}
        )
        save_learning_gaps(session, new_cache)
            
        return {"learning_gaps": gaps}
