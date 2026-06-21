"""
@fileoverview OpenPath Component
@module app/tools/technology_detection
@description Custom tool for detecting repository technology stack by parsing file structures.
@dependencies [sqlmodel, app.db.cache, app.db.models]
@stateConsumed []
@stateProduced []
"""
from typing import List
from sqlmodel import Session
from app.db.cache import get_repo_tech_stack, save_repo_tech_stack
from app.db.models import RepoTechStack

def detect_technology_stack(session: Session, repo_name: str, file_paths: List[str]) -> List[str]:
    """
    Detects the technology stack of a repository based on its file paths.
    Uses the database cache to avoid redundant processing.
    """
    # Check cache first
    cached_stack = get_repo_tech_stack(session, repo_name)
    if cached_stack and cached_stack.frameworks:
        return cached_stack.frameworks

    # Heuristic detection logic
    frameworks = set()
    for path in file_paths:
        path_lower = path.lower()
        if "package.json" in path_lower:
            frameworks.add("Node.js")
        if "requirements.txt" in path_lower or "pyproject.toml" in path_lower or "setup.py" in path_lower:
            frameworks.add("Python")
        if "go.mod" in path_lower:
            frameworks.add("Go")
        if "pom.xml" in path_lower or "build.gradle" in path_lower:
            frameworks.add("Java")
        if "cargo.toml" in path_lower:
            frameworks.add("Rust")
        if "gemfile" in path_lower:
            frameworks.add("Ruby")
            
    detected = list(frameworks)
    
    # Save to cache
    new_tech_stack = RepoTechStack(repo_name=repo_name, frameworks=detected)
    save_repo_tech_stack(session, new_tech_stack)
    
    return detected
