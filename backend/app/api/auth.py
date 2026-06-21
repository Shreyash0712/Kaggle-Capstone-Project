"""
@fileoverview OpenPath Component
@module app/api/auth
@description Handles GitHub OAuth authentication and issues JWT cookies.
@dependencies [fastapi, httpx, jwt, app.db.models, app.core.config]
@stateConsumed []
@stateProduced []
"""
import httpx
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.db.session import get_session
from app.core.config import settings
from app.db.models import User

router = APIRouter()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

@router.get("/github/login")
async def github_login():
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured")
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.BACKEND_URL}/api/v1/auth/github/callback"
        f"&scope=read:user user:email repo"
    )
    # The frontend will usually hit this endpoint and redirect to the url returned.
    # We can either return the URL or just redirect directly.
    return RedirectResponse(url=github_auth_url)

@router.get("/github/callback")
async def github_callback(code: str, response: Response, session: Session = Depends(get_session)):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
        
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"}
        )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            # Fallback redirect to frontend login with error
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=oauth_failed")
            
        # Get user profile
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        
        user_data = user_response.json()
        github_id = user_data.get("id")
        github_handle = user_data.get("login")
        avatar_url = user_data.get("avatar_url")
        
        if not github_handle:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=no_handle")
            
        # Save or update user in DB
        statement = select(User).where(User.github_id == github_id)
        user = session.exec(statement).first()
        
        if not user:
            # Maybe try matching by handle if github_id was previously missing
            statement_handle = select(User).where(User.github_handle == github_handle)
            user = session.exec(statement_handle).first()
            
        if user:
            user.github_id = github_id
            user.avatar_url = avatar_url
            user.access_token = access_token
        else:
            user = User(
                github_id=github_id,
                github_handle=github_handle,
                avatar_url=avatar_url,
                access_token=access_token
            )
            session.add(user)
            
        session.commit()
        session.refresh(user)
        
        # Generate JWT
        jwt_token = create_access_token(data={"sub": str(user.id), "handle": user.github_handle})
        
        # Redirect to frontend dashboard and set cookie
        redirect = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        redirect.set_cookie(
            key="access_token",
            value=f"Bearer {jwt_token}",
            httponly=True,
            samesite="lax",
            secure=False # set to true in production with HTTPS
        )
        
        return redirect

@router.get("/me")
async def get_current_user(request: Request, session: Session = Depends(get_session)):
    token = request.cookies.get("access_token")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(user_id_str)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "github_handle": user.github_handle,
        "avatar_url": user.avatar_url
    }

@router.post("/logout")
async def logout():
    response = Response(status_code=200, content='{"status":"ok"}', media_type="application/json")
    response.delete_cookie("access_token")
    return response
