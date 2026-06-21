"""
@fileoverview OpenPath Component
@module app/core/config
@description Configuration settings for the FastAPI application.
@dependencies [pydantic_settings]
@stateConsumed []
@stateProduced []
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenPath"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/openpath"
    GITHUB_PERSONAL_ACCESS_TOKEN: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    CONTEXT7_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    JWT_SECRET: str = "super_secret_jwt_key_for_development"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

settings = Settings()
