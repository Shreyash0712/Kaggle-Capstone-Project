from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import httpx
import io
from PIL import Image
from dotenv import load_dotenv
load_dotenv()

import cloudinary
import cloudinary.uploader
cloudinary.config(secure=True)


from db.database import get_db
from db.models import User
from auth.schemas import UserResponse, Token, UserNameUpdate
from auth.security import create_access_token, verify_token
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    # Stateless avatar and name for OAuth users, but DB overrides
    if not user.name:
        user.name = payload.get("name")
    if not user.avatar_url:
        user.avatar_url = payload.get("avatar_url")
    return user

# Optionally get current user (for endpoints that allow both auth and unauth)
def get_optional_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        user = get_current_user(token, db)
        return user
    except HTTPException:
        return None

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me/name", response_model=UserResponse)
def update_name(user_update: UserNameUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.name = user_update.name
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=UserResponse)
async def update_avatar(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    content = await file.read()
    try:
        img = Image.open(io.BytesIO(content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail((400, 400)) # optimize size
        
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85)
        output.seek(0)
        
        upload_result = cloudinary.uploader.upload(output.read(), folder="aletheox_avatars")
        current_user.avatar_url = upload_result.get("secure_url")
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/me")
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"status": "ok"}

# --- OAuth Endpoints ---
@router.get("/google/login")
def google_login():
    url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.FRONTEND_URL}/auth/callback/google&scope=openid%20email%20profile&access_type=offline"
    return {"url": url}

@router.post("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
         raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"{settings.FRONTEND_URL}/auth/callback/google",
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange token")
        access_token = response.json().get("access_token")
        
        user_info_resp = await client.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        if user_info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_info_resp.json()
        email = user_info.get("email")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, auth_provider="google")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        app_token = create_access_token(data={
            "sub": user.email, 
            "name": user_info.get("name"), 
            "avatar_url": user_info.get("picture")
        })
        return {"access_token": app_token, "token_type": "bearer"}

@router.get("/github/login")
def github_login():
    url = f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}&redirect_uri={settings.FRONTEND_URL}/auth/callback/github&scope=user:email"
    return {"url": url}

@router.post("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
         raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": f"{settings.FRONTEND_URL}/auth/callback/github"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange token")
        
        access_token = response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
            
        user_resp = await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"})
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user profile")
        user_data = user_resp.json()
        name = user_data.get("name") or user_data.get("login")
        avatar_url = user_data.get("avatar_url")
            
        user_info_resp = await client.get("https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"})
        if user_info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
            
        emails = user_info_resp.json()
        primary_email = next((e["email"] for e in emails if e["primary"]), None)
        if not primary_email:
            raise HTTPException(status_code=400, detail="No primary email found on GitHub")
            
        user = db.query(User).filter(User.email == primary_email).first()
        if not user:
            user = User(email=primary_email, auth_provider="github")
            db.add(user)
            db.commit()
            db.refresh(user)
            
        app_token = create_access_token(data={
            "sub": user.email,
            "name": name,
            "avatar_url": avatar_url
        })
        return {"access_token": app_token, "token_type": "bearer"}
