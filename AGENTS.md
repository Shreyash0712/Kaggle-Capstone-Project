# OpenPath: Multi-Agent System Definition
**Agent, State, and Tool Specifications for AI Assistant**

## 1. The Global State (LangGraph State)
All agents read from and write to this single Python state representation. It explicitly tracks user preferences and session artifacts.
```python
from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class OpenPathState(TypedDict):
    # Identity & Core Profile
    user_id: str
    github_handle: str
    profile: Optional[dict] # Long-Term Memory (from DB)
    
    # User Preferences
    preferred_technologies: List[str]
    preferred_issue_types: List[str]
    interests: List[str]
    target_difficulty: str
    
    # Session Execution Data
    discovered_repos: List[dict]
    selected_issue: Optional[dict]
    learning_gaps: List[dict]
    final_recommendation: Optional[str]
    
    # Internal Tracking
    messages: Annotated[List[BaseMessage], operator.add] # For conversational A2A memory
    cache_hits: List[str] # Tracks which steps bypassed the LLM
```

## 2. Custom Tools & MCPs
The system uses specialized custom tools tightly integrated with the DB, alongside external MCPs:
* **GitHub MCP:** (Read-only) Fetches repo data, user PR history, and issue body text.
* **Documentation MCP:** Uses Upstash Context7 MCP (or similar) to fetch standard docs for React, Node, Python, etc.
* **RDS Cache Interceptor:** A utility function intercepting DB requests to bypass LLM execution if a semantic/hash match is found in the cache tables.
* **Technology Detection Tool:** Custom Python tool that parses repository structures, checking the `repo_tech_stack` DB table first before analyzing files.
* **Issue Complexity Tool:** Calculates file changes, dependency scope, and line count to help estimate issue difficulty.
* **Learning Resource Finder:** Custom tool used by the Learning Gap Agent to find tutorials and examples.

## 3. Context Engineering: Agent Skills
Rather than loading massive system prompts, OpenPath uses **Agent Skills**. Skills are discrete modules of knowledge (e.g., Markdown files for React best practices, Python testing patterns) that are injected into an Agent's prompt *only* when the `Technology Detection Tool` identifies that stack in the selected repository.

## 4. Agent Definitions (LangGraph Nodes)

### Node A: Contributor Profile Agent
* **Objective:** Analyze the user's GitHub activity to determine their tech stack and skill level.
* **Caching Rule:** Verify `users.last_synced_commit_hash`. If up-to-date, populate state and skip LLM.
* **Tools:** GitHub MCP, Technology Detection Tool.
* **Output:** Populates `state["profile"]`.

### Node B: Repository Discovery Agent
* **Objective:** Find open-source repositories matching the user's profile and defined preferences.
* **Routing logic:** If no repos found, transition directly to Mentor Agent to skip empty evaluation.
* **Tools:** GitHub MCP.
* **Output:** Populates `state["discovered_repos"]`.

### Node C1: Difficulty Analysis Agent (Parallel with C2)
* **Objective:** Assess how hard an issue actually is, independent of GitHub labels.
* **Caching Rule:** Query RDS `issue_analysis_cache`. Skip LLM execution on cache hit.
* **Tools:** GitHub MCP, Issue Complexity Tool.
* **Output:** Populates `state["selected_issue"]`.

### Node C2: Learning Gap Agent (Parallel with C1)
* **Objective:** Compare `state["profile"]` against the required technologies of the selected issue.
* **Tools:** Documentation MCP, Learning Resource Finder.
* **Output:** Populates `state["learning_gaps"]`.

### Node D: Mentor Agent (Aggregator & Primary Interface)
* **Objective:** Synthesize all previous agent findings into a readable, encouraging contribution plan.
* **A2A Delegation:** Can delegate specialized questions to a sub-agent, the **Documentation Expert Agent**, for deep-dive technical explanations.
* **State Management:** Implements state reduction on `messages` and `discovered_repos` if context window nears token limits.
* **Output:** Populates `state["final_recommendation"]`.

## 5. Execution Graph
1. Start -> Initialize Preferences -> Check DB Cache
2. Cache Miss -> `Contributor Profile Agent`
3. `Contributor Profile Agent` -> `Repository Discovery Agent`
4. `Repository Discovery Agent` -> Conditional Edge (If Empty -> `Mentor Agent`) -> Parallel Split (`Difficulty Analysis` AND `Learning Gap`)
5. Join Parallel -> `Mentor Agent` (With potential A2A loops to Documentation Expert)
6. `Mentor Agent` -> Save to RDS DB -> End