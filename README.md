# OpenPath: An Agentic Open Source Contribution Mentor
*Kaggle AI Agents Capstone Project*  
*Track: Agents for Good*

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Executive Summary
OpenPath is an AI-powered multi-agent platform that helps developers discover, evaluate, and contribute to open source projects that match their skills and interests.

While platforms like GitHub provide access to millions of repositories, contributors often struggle to determine which issues are appropriate for their skill level, which technologies they need to learn, and where to start contributing.

OpenPath solves this problem through a coordinated system of AI agents that analyze a contributor's GitHub profile, discover relevant opportunities, estimate issue difficulty, identify knowledge gaps, and generate personalized contribution plans.

Unlike traditional recommendation systems that rely solely on repository labels such as "good first issue", OpenPath performs independent investigation of repositories, issues, codebases, and contribution requirements before making recommendations.

The platform demonstrates modern agent engineering concepts including multi-agent orchestration, MCP integrations, agent skills, context engineering, long-term memory, observability, evaluation, and deployment.

## Problem Statement
Open source software powers much of the modern internet, yet contributing remains difficult. Developers commonly face several challenges:
- Finding repositories relevant to their skills
- Understanding whether an issue is actually beginner-friendly
- Determining the technologies required for a contribution
- Learning unfamiliar frameworks before contributing
- Understanding large codebases
- Identifying meaningful opportunities for growth

GitHub labels often fail to accurately represent issue complexity. A "good first issue" may still require significant framework knowledge, while unlabeled issues may be excellent opportunities for contributors. There is currently no intelligent system that continuously evaluates both the contributor and the opportunity before making recommendations.

## Solution
OpenPath acts as an AI mentor for open source contributors. After connecting a GitHub account, the platform builds a contributor profile based on repositories, languages, technologies, and contribution history.

The system then:
1. Discovers relevant repositories
2. Finds matching issues
3. Investigates actual issue complexity
4. Identifies required technologies
5. Detects knowledge gaps
6. Generates personalized contribution guidance

Rather than replacing developers, OpenPath reduces the friction involved in finding and completing meaningful contributions.

## Core User Flow

### Step 1: Connect GitHub
The user connects their GitHub account through OAuth. OpenPath analyzes:
- Public repositories
- Programming languages
- Technology preferences
- Contribution history & Pull requests
- Repository popularity

### Step 2: Build Contributor Profile
The system automatically generates a persistent contributor profile.
```json
{
  "preferredLanguages": ["TypeScript", "Python"],
  "preferredFrameworks": ["React", "FastAPI"],
  "level": "Intermediate",
  "interests": ["Web Development", "AI"]
}
```
Profile estimation considers repository count, contribution activity, technology usage, and project complexity.

### Step 3: Define Preferences
The user can specify:
- **Technologies**: TypeScript, Python, Rust, Go, etc.
- **Issue Types**: Documentation, Good First Issue, Bug Fix, Feature Request.
- **Difficulty**: Beginner, Intermediate, Advanced.
- **Interests**: AI, Web Development, DevOps, Education.

### Step 4: Agent Investigation
Instead of relying solely on GitHub labels, agents investigate each candidate issue by analyzing the issue description, related code, repository size, and historical patterns.

*Example:*
- **GitHub Label**: "Good First Issue"
- **AI Assessment**: "Intermediate"
- **Reason**: Requires understanding of React state management and test architecture.

### Step 5: Contribution Guidance
The user receives:
- Recommended repository & issue
- Difficulty assessment
- Required technologies & Learning resources
- Suggested implementation path

## Multi-Agent Architecture
OpenPath is built using LangGraph. A central orchestrator coordinates multiple specialized agents.

### Orchestrator Agent
- **Responsibilities**: Workflow management, task delegation, result aggregation, error handling.

### Contributor Profile Agent
- **Responsibilities**: Repository analysis, language detection, technology identification, experience estimation.

### Repository Discovery Agent
- **Responsibilities**: Find repositories matching contributor interests, filter by activity.

### Difficulty Analysis Agent
- **Responsibilities**: Estimate actual issue complexity, dependency analysis, skill requirement estimation.

### Learning Gap Agent
- **Responsibilities**: Compare contributor profile against issue requirements, recommend resources.

### Mentor Agent
- **Responsibilities**: Guide contributors, explain issue requirements, provide implementation guidance. Acts as the primary user-facing agent.

## Agent Orchestration Patterns

### Sequential Workflow
`Contributor Profile` -> `Repository Discovery` -> `Difficulty Analysis` -> `Learning Gap` -> `Mentor`

### Parallel Workflow
After repositories are discovered, execution splits:
`Repository Discovery` -> (Parallel: `Difficulty Analysis` AND `Learning Gap`) -> `Mentor`

## Integrations & Tools

### MCP Integration
OpenPath uses the Model Context Protocol (MCP) to connect agents with external systems.
- **GitHub MCP**: Primary knowledge source for repository search, issues, pull requests, and file retrieval.
- **Documentation MCP (Upstash)**: Provides access to official documentation (React, TypeScript, Python, etc.) to explain unfamiliar technologies.

### Custom Backend Tools
Instead of creating unnecessary network overhead with extra MCPs, OpenPath uses optimized backend Python tools connected directly to the database:
- **Technology Detection Tool / Repo Analysis**: Parses repositories and detects languages, frameworks, and tooling. Caches results in the database.
- **Issue Complexity Tool**: Analyzes repository size, issue scope, and affected files.
- **Learning Resource Finder**: Locates tutorials, examples, and official documentation.

## Sessions and Memory
- **Session Memory**: Handled by LangGraph's Postgres Checkpointer. Stores current repository, current issue, recent interactions.
- **Long-Term Memory**: Stored in the `users` and `profiles` PostgreSQL database tables. Tracks preferences, historical recommendations, and skill progression.

## Context Engineering & Agent Skills
OpenPath follows context engineering principles. Rather than relying on massive prompts, specialized "Skills" (knowledge modules) are loaded dynamically based on the detected repository stack.
- **React Skill**: Hooks patterns, state management guidance.
- **Python Skill**: Virtual environments, testing patterns.
- **Git Skill**: Branching workflows, commit conventions.

## Observability & Evaluation Strategy
- **Observability**: Track agent execution time, tool usage, token consumption, and error rates using OpenTelemetry.
- **Evaluation Strategy**: Evaluated against a curated dataset of 50–100 manually reviewed GitHub issues to measure classification accuracy, precision, and recall.

## Security Considerations
- Read-only GitHub access
- Scoped OAuth permissions
- Input validation & prompt injection mitigation
- No repository modifications are performed automatically.

## Deployment Architecture
- **Frontend**: Vite + React
- **Backend**: Python + FastAPI + LangGraph
- **Database**: AWS RDS for PostgreSQL (with pgvector)
- **Deployment**: AWS ECS (Fargate) or App Runner for backend; AWS S3/CloudFront for frontend.
- **Observability**: OpenTelemetry & Structured Logging.

## Kaggle Concepts Demonstrated
- ✓ Multi-Agent System
- ✓ Sequential & Parallel Agents
- ✓ MCP & Custom Tools
- ✓ Sessions, State Management, Long-Term Memory
- ✓ Context Engineering & Agent Skills
- ✓ A2A Protocol
- ✓ Observability & Agent Evaluation
- ✓ Deployment

---

## 🛠️ Quick Start & Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- PostgreSQL (with `pgvector` extension)
- GitHub OAuth App Credentials
- Gemini API Key (or other supported LLM provider)

### 1. Database Setup
Ensure PostgreSQL is running and the `pgvector` extension is installed.
```bash
# Example if using psql:
CREATE DATABASE openpath;
\c openpath
CREATE EXTENSION vector;
```

### 2. Backend Setup
Navigate to the `backend/` directory, set up your virtual environment, and install dependencies.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
Run the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
Navigate to the `frontend/` directory, install dependencies, and start the Vite dev server.
```bash
cd frontend
npm install
cp .env.example .env.local  # Set your VITE_API_BASE_URL if different
npm run dev
```

### 4. Open the App
Visit `http://localhost:5173` in your browser. Log in with GitHub and start exploring open-source contributions tailored just for you!
