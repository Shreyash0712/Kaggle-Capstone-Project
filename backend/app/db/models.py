"""
@fileoverview OpenPath Component
@module app/db/models
@description SQLModel database schemas mapping to the PostgreSQL database.
@dependencies [sqlmodel, pgvector.sqlalchemy, sqlalchemy.dialects.postgresql]
@stateConsumed []
@stateProduced []
"""
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB

class User(SQLModel, table=True):
    __tablename__ = "users" # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    github_handle: str = Field(unique=True, index=True)
    github_id: Optional[int] = Field(default=None, unique=True)
    avatar_url: Optional[str] = Field(default=None)
    access_token: Optional[str] = Field(default=None)
    last_synced_commit_hash: Optional[str] = Field(default=None)
    profile: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))

class IssueAnalysisCache(SQLModel, table=True):
    __tablename__ = "issue_analysis_cache" # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    issue_hash: str = Field(unique=True, index=True)
    difficulty: str
    learning_gaps: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))

class RepoTechStack(SQLModel, table=True):
    __tablename__ = "repo_tech_stack" # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    repo_name: str = Field(unique=True, index=True)
    frameworks: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))

class LearningGapsCache(SQLModel, table=True):
    __tablename__ = "learning_gaps_cache" # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_handle_issue_hash: str = Field(unique=True, index=True) # Composite key representation
    gaps: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))

import uuid
from datetime import datetime

class AnalysisSession(SQLModel, table=True):
    __tablename__ = "analysis_sessions" # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    session_uuid: str = Field(default_factory=lambda: str(uuid.uuid4()), unique=True, index=True)
    github_handle: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    preferences: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    result_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
