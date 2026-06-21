"""
@fileoverview OpenPath Component
@module app/graph/nodes/mentor_agent
@description Implements Node D: Mentor Agent using Gemini. Synthesizes findings into a final recommendation.
@dependencies [app.core.state, langchain_google_genai]
@stateConsumed [profile, preferences, discovered_repos, selected_issue, learning_gaps, skills_context]
@stateProduced [final_recommendation]
"""
import json
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.state import OpenPathState

async def mentor_agent_node(state: OpenPathState) -> Dict[str, Any]:
    """
    Node D: Synthesizes all previous agent findings into a readable, encouraging contribution plan.
    """
    profile = state.get("profile", {})
    preferences = state.get("preferences", {})
    discovered_repos = state.get("discovered_repos", [])
    selected_issue = state.get("selected_issue", {})
    learning_gaps = state.get("learning_gaps", [])
    skills_context = state.get("skills_context", "")

    if not profile or not selected_issue:
        return {"final_recommendation": "Unable to generate a recommendation due to missing data."}

    llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.7)
    
    prompt = PromptTemplate(
        template="""You are a highly skilled open-source mentor.
        Provide a VERY concise summary (max 3 sentences) of why the user should work on the provided issue.
        Do NOT use any emojis.
        Do NOT generate a "Next Steps" or "Action Plan" section.
        You MUST explicitly provide a markdown link to the selected issue using its 'html_url' and 'title'.
        
        User Profile: {profile}
        User Preferences: {preferences}
        Selected Issue: {issue}
        Learning Gaps: {gaps}
        Expert Skills Context: {skills_context}
        """,
        input_variables=["profile", "preferences", "issue", "gaps", "skills_context"],
    )
    
    chain = prompt | llm | StrOutputParser()
    try:
        recommendation = chain.invoke({
            "profile": json.dumps(profile),
            "preferences": json.dumps(preferences),
            "issue": json.dumps(selected_issue),
            "gaps": json.dumps(learning_gaps),
            "skills_context": skills_context
        })
    except Exception as e:
        recommendation = f"Failed to generate recommendation: {str(e)}"
        
    return {"final_recommendation": recommendation}
