"""
@fileoverview OpenPath Component
@module app/db/session
@description Database connection and session management setup using SQLModel.
@dependencies [sqlmodel, app.core.config]
@stateConsumed []
@stateProduced []
"""
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings
import psycopg_pool
from contextlib import contextmanager, asynccontextmanager

# Connection pool strategy as requested by user
engine = create_engine(
    settings.DATABASE_URL, 
    echo=True, 
    pool_size=10, 
    max_overflow=20
)

# Psycopg pool for LangGraph checkpointer
# Replace driver if necessary for psycopg3
psycopg_url = settings.DATABASE_URL.replace("+psycopg2", "")
checkpointer_pool = psycopg_pool.ConnectionPool(
    conninfo=psycopg_url,
    max_size=20,
    kwargs={"autocommit": True, "prepare_threshold": 0}
)

def init_db():
    from app.db import models # ensure models are registered
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

@contextmanager
def get_checkpointer_pool():
    yield checkpointer_pool

# Psycopg pool for LangGraph checkpointer (async)
_async_checkpointer_pool = None

@asynccontextmanager
async def get_async_checkpointer_pool():
    global _async_checkpointer_pool
    if _async_checkpointer_pool is None:
        _async_checkpointer_pool = psycopg_pool.AsyncConnectionPool(
            conninfo=psycopg_url,
            max_size=20,
            kwargs={"autocommit": True, "prepare_threshold": 0}
        )
    yield _async_checkpointer_pool
