"""
@fileoverview OpenPath Component
@module app/core/state
@description Defines the global LangGraph state structure for the OpenPath application.
@dependencies [typing, langchain_core]
@stateConsumed []
@stateProduced []
"""
from typing import TypedDict, Annotated, List, Optional, Any
from langchain_core.messages import BaseMessage
import operator

class OpenPathState(TypedDict):
    user_id: str
    github_handle: str
    profile: Optional[dict]
    preferences: Optional[dict]
    discovered_repos: List[dict]
    selected_issue: Optional[dict]
    learning_gaps: List[dict]
    skills_context: Optional[str]
    final_recommendation: Optional[str]
    messages: Annotated[List[BaseMessage], operator.add]
    cache_hits: List[str]
