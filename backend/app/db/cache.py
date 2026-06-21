"""
@fileoverview OpenPath Component
@module app/db/cache
@description Utility functions for semantic caching via SQLModel to minimize LLM usage.
@dependencies [sqlmodel, app.db.models]
@stateConsumed []
@stateProduced []
"""
from typing import Optional
from sqlmodel import Session, select
from app.db.models import User, IssueAnalysisCache, RepoTechStack, LearningGapsCache

def get_user_profile(session: Session, github_handle: str) -> Optional[User]:
    statement = select(User).where(User.github_handle == github_handle)
    return session.exec(statement).first()

def get_issue_analysis_cache(session: Session, issue_hash: str) -> Optional[IssueAnalysisCache]:
    statement = select(IssueAnalysisCache).where(IssueAnalysisCache.issue_hash == issue_hash)
    return session.exec(statement).first()

def get_repo_tech_stack(session: Session, repo_name: str) -> Optional[RepoTechStack]:
    statement = select(RepoTechStack).where(RepoTechStack.repo_name == repo_name)
    return session.exec(statement).first()

def get_learning_gaps_cache(session: Session, user_handle_issue_hash: str) -> Optional[LearningGapsCache]:
    statement = select(LearningGapsCache).where(LearningGapsCache.user_handle_issue_hash == user_handle_issue_hash)
    return session.exec(statement).first()

def save_user_profile(session: Session, user: User) -> None:
    session.add(user)
    session.commit()
    session.refresh(user)

def save_issue_analysis(session: Session, issue_analysis: IssueAnalysisCache) -> None:
    session.add(issue_analysis)
    session.commit()
    session.refresh(issue_analysis)

def save_repo_tech_stack(session: Session, repo_tech: RepoTechStack) -> None:
    session.add(repo_tech)
    session.commit()
    session.refresh(repo_tech)

def save_learning_gaps(session: Session, learning_gaps: LearningGapsCache) -> None:
    session.add(learning_gaps)
    session.commit()
    session.refresh(learning_gaps)
