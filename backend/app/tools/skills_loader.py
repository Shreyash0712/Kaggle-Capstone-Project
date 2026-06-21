"""
@fileoverview OpenPath Component
@module app/tools/skills_loader
@description Utility to dynamically load static markdown skills (context) based on repository tech stack.
@dependencies [os, typing]
@stateConsumed []
@stateProduced []
"""
import os
from typing import List

SKILLS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "skills")

def load_skills_context(tech_stack: List[str]) -> str:
    """
    Scans the skills/ directory for markdown files matching the detected tech stack.
    Returns concatenated markdown content to be used as context.
    """
    if not os.path.exists(SKILLS_DIR):
        return ""

    context_parts = []
    
    for tech in tech_stack:
        # Simple normalization: lowercased, remove spaces/dots
        normalized_tech = tech.lower().replace(" ", "").replace(".", "")
        file_path = os.path.join(SKILLS_DIR, f"{normalized_tech}.md")
        
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    context_parts.append(f"### Skill Context: {tech}\n{content}\n")
            except Exception as e:
                # Log error in production, ignore here for resilience
                pass
                
    return "\n".join(context_parts)
