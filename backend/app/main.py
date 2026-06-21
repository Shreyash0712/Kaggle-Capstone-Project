"""
@fileoverview OpenPath Component
@module app/main
@description FastAPI application entry point.
@dependencies [fastapi, app.db.session, app.core.config]
@stateConsumed []
@stateProduced []
"""
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session
from langgraph.checkpoint.postgres import PostgresSaver

from fastapi.middleware.cors import CORSMiddleware
from app.db.session import init_db, get_session, get_checkpointer_pool, get_async_checkpointer_pool
from app.core.config import settings
from app.graph.workflow import get_compiled_graph
from app.api.auth import router as auth_router
from app.api.users import router as users_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])

@app.on_event("startup")
def on_startup():
    try:
        init_db()
        print("Database initialized successfully.")
        
        # Setup Postgres checkpointer tables
        with get_checkpointer_pool() as pool:
            PostgresSaver(pool).setup()
            print("Postgres Checkpointer tables initialized successfully.")
            
    except Exception as e:
        print(f"Warning: Could not initialize database - {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

@app.post("/api/mentor/analyze")
async def analyze(handle: str, session: Session = Depends(get_session)):
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    try:
        async with get_async_checkpointer_pool() as pool:
            checkpointer = AsyncPostgresSaver(pool)
            graph = get_compiled_graph(checkpointer=checkpointer)
            
            # Use the handle as thread_id for session persistence
            config = {"configurable": {"thread_id": handle}}
            
            initial_state = {
                "user_id": handle,  # Mock user_id for now
                "github_handle": handle,
                "profile": None,
                "discovered_repos": [],
                "selected_issue": None,
                "learning_gaps": [],
                "final_recommendation": None,
                "messages": [],
                "cache_hits": []
            }
            
            # Execute the graph asynchronously
            result = await graph.ainvoke(initial_state, config=config)
            
            return {
                "status": "success",
                "handle": handle,
                "final_recommendation": result.get("final_recommendation"),
                "cache_hits": result.get("cache_hits")
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import json
from fastapi.responses import StreamingResponse

@app.get("/api/mentor/analyze/stream")
async def analyze_stream(handle: str, session: Session = Depends(get_session)):
    async def event_generator():
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
        try:
            async with get_async_checkpointer_pool() as pool:
                checkpointer = AsyncPostgresSaver(pool)
                graph = get_compiled_graph(checkpointer=checkpointer)
                
                config = {"configurable": {"thread_id": handle}}
                
                from app.db.models import User
                from sqlmodel import select
                user_db = session.exec(select(User).where(User.github_handle == handle)).first()
                preferences = user_db.profile if user_db else {}
                
                initial_state = {
                    "user_id": handle,
                    "github_handle": handle,
                    "profile": None,
                    "preferences": preferences,
                    "discovered_repos": [],
                    "selected_issue": None,
                    "learning_gaps": [],
                    "final_recommendation": None,
                    "messages": [],
                    "cache_hits": []
                }
                
                accumulated_state = {}
                
                # yield initial event
                yield f"data: {json.dumps({'step': 'init', 'message': 'Starting analysis...'})}\n\n"
                
                async for event in graph.astream(initial_state, config=config, stream_mode="updates"):
                    for node_name, state_updates in event.items():
                        payload = {
                            "step": node_name,
                            "updates": {k: "updated" for k in state_updates.keys()}
                        }
                        
                        # Forward these specific keys if present in state_updates
                        for key in ["final_recommendation", "discovered_repos", "learning_gaps", "selected_issue"]:
                            if key in state_updates:
                                payload[key] = state_updates[key]
                                accumulated_state[key] = state_updates[key]
                                
                        yield f"data: {json.dumps(payload)}\n\n"
                
                # Save session to DB
                from app.db.models import AnalysisSession
                new_session = AnalysisSession(
                    github_handle=handle,
                    preferences=preferences,
                    result_data=accumulated_state
                )
                session.add(new_session)
                session.commit()
                session.refresh(new_session)
                
                yield f"data: {json.dumps({'step': 'complete', 'message': 'Analysis complete.', 'session_id': new_session.session_uuid})}\n\n"
        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = traceback.format_exc()
            yield f"data: {json.dumps({'step': 'error', 'message': error_msg})}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/mentor/sessions")
def get_sessions(handle: str, session: Session = Depends(get_session)):
    from app.db.models import AnalysisSession
    from sqlmodel import select
    sessions = session.exec(select(AnalysisSession).where(AnalysisSession.github_handle == handle).order_by(AnalysisSession.created_at.desc())).all()
    # Map id to session_uuid to keep frontend interface mostly the same
    return {"sessions": [{"id": s.session_uuid, "created_at": s.created_at, "result_data": s.result_data} for s in sessions]}

@app.get("/api/mentor/sessions/{session_uuid}")
def get_session_by_uuid(session_uuid: str, session: Session = Depends(get_session)):
    from app.db.models import AnalysisSession
    from sqlmodel import select
    session_data = session.exec(select(AnalysisSession).where(AnalysisSession.session_uuid == session_uuid)).first()
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": {"id": session_data.session_uuid, "created_at": session_data.created_at, "result_data": session_data.result_data}}

@app.delete("/api/mentor/sessions/{session_uuid}")
def delete_session(session_uuid: str, session: Session = Depends(get_session)):
    from app.db.models import AnalysisSession
    from sqlmodel import select
    session_data = session.exec(select(AnalysisSession).where(AnalysisSession.session_uuid == session_uuid)).first()
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    session.delete(session_data)
    session.commit()
    return {"status": "success"}
