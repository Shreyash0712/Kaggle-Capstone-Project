from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import DecisionSession

def cleanup_unauthenticated_sessions():
    """
    Deletes sessions that are not linked to a user and are older than 24 hours.
    """
    db: Session = SessionLocal()
    try:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        old_sessions = db.query(DecisionSession).filter(
            DecisionSession.user_id.is_(None),
            DecisionSession.created_at < cutoff_time
        ).all()
        
        count = len(old_sessions)
        if count > 0:
            for session in old_sessions:
                db.delete(session)
            db.commit()
            print(f"Cleanup Job: Deleted {count} unauthenticated abandoned sessions.")
    except Exception as e:
        print(f"Cleanup Job Error: {e}")
        db.rollback()
    finally:
        db.close()
