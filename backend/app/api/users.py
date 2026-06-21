"""
@fileoverview OpenPath Component
@module app/api/users
@description Handles user profile and preferences updates.
@dependencies [fastapi, sqlmodel, app.db.models, app.api.auth, pydantic]
@stateConsumed []
@stateProduced []
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

from app.db.session import get_session
from app.api.auth import get_current_user
from app.db.models import User

router = APIRouter()

class PreferencesUpdate(BaseModel):
    technologies: Optional[List[str]] = None
    issue_types: Optional[List[str]] = None
    difficulty: Optional[str] = None
    interests: Optional[List[str]] = None

@router.get("/me/preferences", response_model=Dict[str, Any])
async def get_preferences(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    user = session.get(User, current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user.profile or {}

@router.put("/me/preferences", response_model=Dict[str, Any])
async def update_preferences(
    prefs: PreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    user = session.get(User, current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Initialize profile if None
    if user.profile is None:
        user.profile = {}
        
    # Create a new dict to trigger SQLAlchemy's JSONB mutation detection
    new_profile = dict(user.profile)
    
    if prefs.technologies is not None:
        new_profile["technologies"] = prefs.technologies
    if prefs.issue_types is not None:
        new_profile["issue_types"] = prefs.issue_types
    if prefs.difficulty is not None:
        new_profile["difficulty"] = prefs.difficulty
    if prefs.interests is not None:
        new_profile["interests"] = prefs.interests
        
    user.profile = new_profile
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user.profile

@router.post("/debug/clear-db")
async def clear_db(session: Session = Depends(get_session)):
    from sqlmodel import delete
    from app.db.models import User, IssueAnalysisCache, RepoTechStack, LearningGapsCache
    session.exec(delete(User))
    session.exec(delete(IssueAnalysisCache))
    session.exec(delete(RepoTechStack))
    session.exec(delete(LearningGapsCache))
    session.commit()
    return {"status": "ok", "message": "Database cleared successfully"}
