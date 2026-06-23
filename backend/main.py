"""
Main FastAPI application entrypoint.
Wraps the LangGraph execution in an API and persists state to PostgreSQL.
"""
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
import json
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

from core.config import settings
from db.database import get_db, engine, Base
from db.models import DecisionSession, Message, User
from db.cleanup import cleanup_unauthenticated_sessions
from auth.router import router as auth_router, get_optional_user, get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)

    # Start the scheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_unauthenticated_sessions, 'interval', hours=1)
    scheduler.start()
    yield
    # Shutdown the scheduler
    scheduler.shutdown()

app = FastAPI(title="Aletheox API", version="1.0.0", lifespan=lifespan)

app.include_router(auth_router)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL], # Must be explicit when allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SessionCreateRequest(BaseModel):
    user_premise: str

class QueryRequest(BaseModel):
    query: Optional[str] = None
    session_id: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Aletheox Backend is running."}

@app.post("/api/sessions")
def create_session(request: SessionCreateRequest, db: Session = Depends(get_db), user: Optional[User] = Depends(get_optional_user)):
    """Create a new decision session."""
    session = DecisionSession(user_premise=request.user_premise, user_id=user.id if user else None)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": str(session.id), "status": session.status, "user_premise": session.user_premise}

@app.get("/api/user/sessions")
def get_user_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all sessions for the authenticated user."""
    sessions = db.query(DecisionSession).filter(DecisionSession.user_id == current_user.id).order_by(DecisionSession.created_at.desc()).all()
    return [
        {
            "session_id": str(s.id),
            "user_premise": s.user_premise,
            "status": s.status,
            "created_at": s.created_at,
            "scorecard": s.scorecard
        }
        for s in sessions
    ]

@app.delete("/api/user/sessions")
def delete_all_user_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete all sessions for the authenticated user."""
    db.query(DecisionSession).filter(DecisionSession.user_id == current_user.id).delete()
    db.commit()
    return {"status": "ok"}

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session details and message history."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    session = db.query(DecisionSession).filter(DecisionSession.id == session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(Message).filter(Message.session_id == session_uuid).order_by(Message.created_at).all()
    
    return {
        "session_id": str(session.id),
        "user_premise": session.user_premise,
        "status": session.status,
        "scorecard": session.scorecard,
        "messages": [{"id": str(m.id), "agent_role": m.agent_role, "content": m.content, "created_at": m.created_at} for m in messages]
    }

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a session."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    session = db.query(DecisionSession).filter(DecisionSession.id == session_uuid, DecisionSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(session)
    db.commit()
    return {"status": "ok"}

@app.post("/api/debate")
async def run_debate(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Endpoint to trigger the LangGraph debate with token-by-token streaming.
    """
    try:
        session_uuid = uuid.UUID(request.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    db_session = db.query(DecisionSession).filter(DecisionSession.id == session_uuid).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save incoming user query if provided
    if request.query:
        user_msg = Message(session_id=session_uuid, agent_role="user", content=request.query)
        db.add(user_msg)
        db.commit()
    
    # Load all previous messages from DB
    db_messages = db.query(Message).filter(Message.session_id == session_uuid).order_by(Message.created_at).all()
    
    input_messages = []
    # Add initial premise as user if this is the start and there are no messages
    if not db_messages:
        input_messages.append(("user", f"Here is my premise: {db_session.user_premise}"))
        
    from langchain_core.messages import AIMessage
    for m in db_messages:
        if m.agent_role in ["user", "human"]:
            input_messages.append(("user", m.content))
        else:
            input_messages.append(AIMessage(content=m.content, name=m.agent_role))
        
    # Import graph here to avoid circular dependencies if any
    from agents.graph import graph
        
    # Provide the previous scorecard into the state so the arbitrator knows it
    current_state = {
        "messages": input_messages,
        "scorecard": db_session.scorecard or {"advocate_score": 50, "challenger_score": 50}
    }
    
    # Run the debate completely
    final_state = await graph.ainvoke(current_state, version="v2")
    
    def get_val(obj, key, default):
        if isinstance(obj, dict):
            return obj.get(key, default)
        if hasattr(obj, "get") and callable(getattr(obj, "get")):
            return obj.get(key, default)
        try:
            return obj[key]
        except (TypeError, KeyError, AttributeError):
            return getattr(obj, key, default)

    advocate_argument = get_val(final_state, "advocate_argument", "")
    challenger_argument = get_val(final_state, "challenger_argument", "")
    detective_questions = get_val(final_state, "detective_questions", "")
    new_scorecard = get_val(final_state, "scorecard", {})

    if advocate_argument:
        db.add(Message(session_id=session_uuid, agent_role="advocate", content=advocate_argument))
    if challenger_argument:
        db.add(Message(session_id=session_uuid, agent_role="challenger", content=challenger_argument))
    if detective_questions:
        db.add(Message(session_id=session_uuid, agent_role="detective", content=detective_questions))
        
    if new_scorecard:
        db_session.scorecard = new_scorecard
        
    db.commit()
    
    return {"result": {
        "advocate_argument": advocate_argument,
        "challenger_argument": challenger_argument,
        "detective_questions": detective_questions,
        "scorecard": new_scorecard
    }}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
