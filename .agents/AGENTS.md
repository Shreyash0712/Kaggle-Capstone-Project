# UI Design Rules

- **Minimalistic Aesthetics**: Keep the UI clean, modern, and minimalistic. Avoid overly complex gradients or intense glowing box shadows.
- **Color Palette Restrictions**: Do NOT use colors like blue or purple as they make the UI look very "generated". Use sophisticated, neutral colors with a subtle accent (e.g., emerald, teal, sage).
- **Theming & Semantic Variables**: Never use static Tailwind color utilities (e.g., `bg-slate-900`, `text-blue-500`). Always define and use semantic CSS variables mapped through Tailwind's `@theme` directive, such as `bg-background`, `text-foreground`, `border-border`, etc.
- **Light/Dark Mode**: Always ensure full support for both Light and Dark themes via semantic variables.
- **Brevity**: Keep the code small and readable. If a file gets too big - divide it into reusable components for use. 

# Architecture & Tech Stack Rules

- **Strict Tech Stack**: Vite + React for frontend. Python + FastAPI + LangGraph for backend. AWS RDS + pgvector for database. Model Context Protocol (MCP) for external integrations.
- **Context Engineering over Megaprompts**: Agents should only be fed the exact state and skills they need for their specific node in the LangGraph workflow.
- **Strict State Typing**: All inter-agent communication must pass through a strictly typed State object (defined in Python using `TypedDict` or `Pydantic`).
- **Database Caching Strategy (CRITICAL)**: LLM calls are expensive. The system must aggressively cache agent outputs in the Postgres database. This includes Profile Caching (`users.last_synced_commit_hash`), Issue Fingerprinting (`issue_analysis_cache`), and Repo Metadata Caching (`repo_tech_stack`).
- **Self-Documenting File Protocol (Mandatory)**: Every code file created or modified MUST include a standardized, mini-manifesto comment block at the top:
  ```
  @fileoverview OpenPath Component
  @module [e.g., Graph/Nodes or API/Routes]
  @description Clear 2-sentence description of what this file does.
  @dependencies [List of critical imports/MCP tools used]
  @stateConsumed [State fields read from OpenPathState]
  @stateProduced [State fields mutated in OpenPathState]
  ```
- **Environment Variable Tracking**: Always keep a document of all environment variables for frontend and backend updated in their respective `.env.example` files.


# Multi-Agent System Definition

## Global State (LangGraph State)
```python
from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class OpenPathState(TypedDict):
    user_id: str
    github_handle: str
    profile: Optional[dict]
    discovered_repos: List[dict]
    selected_issue: Optional[dict]
    learning_gaps: List[dict]
    final_recommendation: Optional[str]
    messages: Annotated[List[BaseMessage], operator.add]
    cache_hits: List[str]
```

## Agent Definitions (LangGraph Nodes)
- **Node A: Contributor Profile Agent**: Analyzes user's GitHub activity. Populates `profile`.
- **Node B: Repository Discovery Agent**: Finds open-source repositories matching profile. Populates `discovered_repos`.
- **Node C1: Difficulty Analysis Agent**: Assesses issue difficulty. Populates `selected_issue`. Runs in parallel with C2.
- **Node C2: Learning Gap Agent**: Compares profile against issue requirements. Populates `learning_gaps`. Runs in parallel with C1.
- **Node D: Mentor Agent**: Synthesizes findings into a final recommendation.
