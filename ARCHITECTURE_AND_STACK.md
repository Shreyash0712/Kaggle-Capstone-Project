# OpenPath: Architecture & Tech Stack Definition
**System Context for AI Assistant**

## 1. Project Overview
OpenPath is an AI-powered multi-agent platform that acts as an Open Source Contribution Mentor. It discovers repositories, evaluates issue difficulty independently of GitHub labels, identifies knowledge gaps, and generates personalized contribution plans.

## 2. Technology Stack
The project must strictly adhere to the following stack. Do not introduce alternative frameworks without explicit instruction.
* **Frontend Layer:** Vite + React (Single Page Application).
* **Backend API Layer:** Python with FastAPI.
* **Agent Orchestration:** LangGraph (Python implementation for stateful, multi-agent workflow management).
* **Database (Long-Term Memory & Cache):** AWS RDS for PostgreSQL using `SQLModel` and `JSONB` for array fields and agent payloads.
* **Vector Memory / Semantic Search:** pgvector (running on AWS RDS).
* **External Integrations:** Model Context Protocol (MCP) for GitHub, and third-party MCPs for documentation.
* **Deployment Target:** AWS ECS (Fargate) or App Runner for the backend; AWS S3/CloudFront for the frontend.

## 3. Core Architecture Principles
* **Context Engineering over Megaprompts:** Agents receive only the exact state and skills they need. We use an **Agent Skills** pattern where specific knowledge modules (e.g., React Contribution Guidelines) are dynamically loaded into context only when needed.
* **Strict State Typing:** Inter-agent communication is governed by the `OpenPathState` TypedDict.
* **Custom Python Tools vs External MCPs:** To reduce network overhead, database-reliant tasks (like Repository Technology Detection and Cache Checkups) are built as direct Python tools invoked by LangGraph, while strictly external data sources (GitHub) use MCP.

## 4. Token Optimization & Database Caching Strategy (CRITICAL)
LLM calls are expensive. The system must aggressively cache agent outputs.
* **Profile Caching (Long-Term Memory):** The `users` table tracks `last_synced_commit_hash`. The Contributor Profile Agent is invoked ONLY if the history has new commits. Otherwise, the profile is fetched directly from Postgres DB.
* **Issue Fingerprinting:** Hash the issue title, body, and repo name before running the Difficulty Agent. On an `issue_analysis_cache` match, return cached results immediately.
* **Repo Metadata Caching:** The `Technology Detection Tool` saves parsed frameworks to `repo_tech_stack`. Never run an LLM to detect the stack of a repo already analyzed.

## 5. Session Memory vs Long Term Memory
* **Session Memory**: Managed by the **LangGraph Postgres Checkpointer**. This tracks the immediate user conversation, current repository selection, and internal agent message threads for a single execution run.
* **Long-Term Memory**: Managed by standard **PostgreSQL tables (`users`, `profiles`)**. This tracks the user's permanent skill progression, past successful contributions, and overarching tech preferences.

## 6. Evaluation & Observability Framework
An evaluation pipeline runs completely separate from production orchestration.
* **Observability:** OpenTelemetry traces record execution times, token usage, and tool calls for every LangGraph node.
* **Accuracy Evaluation:** A static dataset of 50-100 manually reviewed GitHub issues is used to run batch tests. The output is evaluated for precision and recall on difficulty assessments to ensure agent reliability.

## 7. API & Orchestration Flow
1. FastAPI receives a request at `POST /api/mentor/analyze` containing user preferences.
2. The route checks the AWS RDS database for valid cached evaluations.
3. If a cache miss occurs, initialize a LangGraph state and execute the multi-agent workflow.
4. Write new LLM outputs back to RDS.
5. Return the aggregated `Mentor Agent` response via SSE (Server-Sent Events) or JSON.

## 8. Self-Documenting File Protocol (Mandatory)
Format required at the top of ALL code files:
"""
@fileoverview OpenPath Component
@module [e.g., Graph/Nodes or API/Routes]
@description Clear 2-sentence description of what this file does.
@dependencies [List of critical imports/MCP tools used]
@stateConsumed [State fields read from OpenPathState]
@stateProduced [State fields mutated in OpenPathState]
"""