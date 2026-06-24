from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    auth_provider: str
    created_at: datetime
    name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class UserNameUpdate(BaseModel):
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
