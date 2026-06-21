"""
@fileoverview OpenPath Component
@module app/graph/nodes/difficulty_agent
@description Implements Node C1: Difficulty Analysis Agent using Groq. Assesses issue difficulty, checking DB cache first.
@dependencies [app.core.state, app.db.session, app.db.cache, app.tools.issue_complexity, langchain_groq]
@stateConsumed [discovered_repos]
@stateProduced [selected_issue, cache_hits]
"""
import json
import hashlib
from typing import Dict, Any
from sqlmodel import Session
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.core.state import OpenPathState
from app.db.session import engine
from app.db.cache import get_issue_analysis_cache, save_issue_analysis
from app.db.models import IssueAnalysisCache
from app.tools.issue_complexity import calculate_issue_complexity

async def difficulty_agent_node(state: OpenPathState) -> Dict[str, Any]:
    """
    Node C1: Analyzes the difficulty of an issue.
    Selects the first issue from the first discovered repo (mock logic for Phase 4),
    checks cache, and if miss, uses Groq to analyze.
    """
    discovered_repos = state.get("discovered_repos", [])
    if not discovered_repos:
        return {}
        
    repo_name = discovered_repos[0].get("repo_name", "unknown/repo")

    repo_parts = repo_name.split("/")
    if len(repo_parts) == 2:
        owner, repo = repo_parts
    else:
        owner, repo = "unknown", "repo"
        
    # 1. Fetch a real issue from the given repo via MCP
    from app.mcp.github_client import get_github_mcp_client
    import json
    
    try:
        async with get_github_mcp_client() as session:
            result = await session.call_tool("list_issues", {"owner": owner, "repo": repo, "perPage": 1, "state": "OPEN"})
            issues_data = json.loads("".join([c.text for c in result.content if hasattr(c, 'text')]))
            if issues_data and "issues" in issues_data and len(issues_data["issues"]) > 0:
                first_issue = issues_data["issues"][0]
                mock_issue_title = first_issue.get("title", f"Issue in {repo_name}")
                mock_issue_body = first_issue.get("body", "No description provided.")
                issue_number = first_issue.get("number", 1)
                mock_issue_html_url = f"https://github.com/{repo_name}/issues/{issue_number}"
            else:
                mock_issue_title = f"Implement feature in {repo_name}"
                mock_issue_body = "Please add the missing functionality."
                mock_issue_html_url = f"https://github.com/{repo_name}/issues"
    except Exception as e:
        print(f"Error fetching issues via MCP: {e}")
        mock_issue_title = f"Implement feature in {repo_name}"
        mock_issue_body = "Please add the missing functionality."
        mock_issue_html_url = f"https://github.com/{repo_name}/issues"
        
    # Fingerprint the issue
    issue_string = f"{repo_name}::{mock_issue_title}::{mock_issue_body}"
    issue_hash = hashlib.sha256(issue_string.encode('utf-8')).hexdigest()

    # 2. Check Cache
    with Session(engine) as session:
        cached_analysis = get_issue_analysis_cache(session, issue_hash)
        
        if cached_analysis:
            selected_issue = {
                "repo_name": repo_name,
                "title": mock_issue_title,
                "body": mock_issue_body,
                "html_url": mock_issue_html_url,
                "difficulty": cached_analysis.difficulty,
                "hash": issue_hash
            }
            return {
                "selected_issue": selected_issue,
                "cache_hits": ["Node C1: Difficulty Analysis Agent (DB Cache)"]
            }

        # 3. Cache Miss - Execute Tool & LLM Logic
        # Use our custom tool
        heuristic_difficulty = calculate_issue_complexity(files_changed=3, lines_added=50, lines_deleted=10)

        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
        
        prompt = PromptTemplate(
            template="""You are a senior developer analyzing issue difficulty.
            Based on the issue details and the heuristic tool's assessment, determine the final difficulty level.
            
            Issue Title: {title}
            Issue Body: {body}
            Heuristic Difficulty: {heuristic}
            
            Respond strictly with valid JSON containing a single key 'difficulty' with value 'Easy', 'Medium', or 'Hard'.
            """,
            input_variables=["title", "body", "heuristic"],
        )
        
        chain = prompt | llm | JsonOutputParser()
        try:
            result = await chain.ainvoke({
                "title": mock_issue_title, 
                "body": mock_issue_body, 
                "heuristic": heuristic_difficulty
            })
            final_difficulty = result.get("difficulty", heuristic_difficulty)
        except Exception as e:
            final_difficulty = heuristic_difficulty
        
        # 3. Save to Cache
        new_analysis = IssueAnalysisCache(
            issue_hash=issue_hash,
            difficulty=final_difficulty
        )
        save_issue_analysis(session, new_analysis)
        
        selected_issue = {
            "repo_name": repo_name,
            "title": mock_issue_title,
            "body": mock_issue_body,
            "html_url": mock_issue_html_url,
            "difficulty": final_difficulty,
            "hash": issue_hash
        }
            
        return {"selected_issue": selected_issue}
