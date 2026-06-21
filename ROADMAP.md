# OpenPath: Implementation Roadmap & State Tracker

## Phase 1: Backend Foundation (Python/FastAPI)
- [x] Initialize Python backend with FastAPI and `uvicorn`.
- [x] Set up AWS RDS for PostgreSQL database and pgvector extension.
- [x] Implement database schema in SQLModel (Users, Profiles, Cache tables).
- [x] Define global Python `TypedDict` for `OpenPathState` inside `state.py`.

## Phase 2: Frontend Foundation (Vite/React)
- [x] Initialize React frontend using Vite (`npm create vite@latest openpath-ui -- --template react-ts`).
- [x] Set up basic routing and API client to communicate with FastAPI backend.
- [x] Implement a visually stunning dashboard with dark mode and micro-animations (Aesthetics).

## Phase 3: Custom Tools & External Interceptors (Backend)
- [x] Build `RDS Cache Interceptor` utility function for semantic caching via SQLModel.
- [x] Build `Technology Detection Tool` (parsing repo files) internally in Python.
- [x] Build `Issue Complexity Tool` (weighting files/lines changed).
- [x] Configure read-only GitHub MCP client connectivity natively inside Python.
- [x] Configure `Documentation MCP` (Upstash) to fetch official docs (React, Python, etc.).
- [x] Build `Learning Resource Finder` custom tool to pull tutorials and examples.

## Phase 4: Isolated Agent Nodes (LangGraph)
- [x] Implement Contributor Profile Agent node with caching logic.
- [x] Implement Repository Discovery Agent node with conditional routing.
- [x] Implement Parallel Nodes: Difficulty Analysis Agent & Learning Gap Agent.
- [x] Implement Mentor Agent (Aggregator) node with context reduction.
- [x] Expand `OpenPathState` and agents to accept User Preferences (Interests, Issue Types).
- [x] Implement `Agent Skills` system (loading static markdown docs as context based on repo tech stack).

## Phase 5: Authentication & User Identity
- [x] Implement GitHub OAuth flow in FastAPI (Login & Callback).
- [x] Set up JWT cookie-based session management.
- [x] Update Database `User` schema to handle OAuth fields.
- [x] Build global `AuthContext` on the React frontend.

## Phase 6: Frontend Application & UI Polish
- [x] Build a stunning Login page with micro-animations.
- [x] Implement protected routing.
- [x] Create a Preferences Configuration UI for defining issue types and difficulties.
- [x] Create the Main Dashboard to display analyzed agent output (`discovered_repos`, `learning_gaps`, etc.).
- [x] Integrate LangGraph Server-Sent Events (SSE) streaming so the user can watch the agents' reasoning process live.

## Phase 7: Graph Orchestration & A2A
- [x] Connect nodes into a compiled LangGraph state machine workflow.
- [x] Add session state persistence with LangGraph Postgres Checkpointer on RDS.
- [x] Create FastAPI Route `POST /api/mentor/analyze` running the graph.
- [x] Expand Agent-to-Agent (A2A) protocol to allow the Mentor Agent to query a `Documentation Expert Agent`.

## Phase 8: AWS Deployment & Observability
- [ ] Dockerize the Python FastAPI backend.
- [ ] Deploy backend to AWS ECS (Fargate) or App Runner.
- [ ] Deploy frontend SPA to AWS S3/CloudFront or similar CDN.
- [ ] Wire up OpenTelemetry logging for observability tracking.
- [ ] Ensure strict API rate limiting and security headers (Prompt injection mitigation).

## Phase 9: Evaluation, Tuning & Metrics (Final Phase)
- [ ] Create an evaluation dataset of 50-100 manually reviewed GitHub issues.
- [ ] Build automated evaluation script to test LangGraph node accuracy against the dataset.
- [ ] Analyze precision and recall of the Difficulty Analysis and Learning Gap agents.