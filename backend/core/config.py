"""
Configuration management using pydantic-settings.
This module loads environment variables from the .env file.
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Config
    ENVIRONMENT: str
    PORT: int
    
    # AI Models / Providers
    GEMINI_API_KEY: str
    GROQ_API_KEY: str
    
    # Active Model Provider (gemini or groq)
    ACTIVE_LLM_PROVIDER: str
    
    # Tooling
    TAVILY_API_KEY: str
    
    # PostgreSQL Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    DATABASE_URL: str
    
    # Neon PostgreSQL Database (Optional)
    PGHOST: Optional[str] = None
    PGDATABASE: Optional[str] = None
    PGUSER: Optional[str] = None
    PGPASSWORD: Optional[str] = None
    PGSSLMODE: Optional[str] = None
    PGCHANNELBINDING: Optional[str] = None
    
    # Auth configuration
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # OAuth configuration
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    

    FRONTEND_URL: str
    
    # This ensures it loads from the local backend .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    def get_database_url(self) -> str:
        # Check if Neon variables are provided
        if self.PGHOST and self.PGUSER and self.PGPASSWORD and self.PGDATABASE:
            url = f"postgresql://{self.PGUSER}:{self.PGPASSWORD}@{self.PGHOST}/{self.PGDATABASE}"
            options = []
            if self.PGSSLMODE:
                options.append(f"sslmode={self.PGSSLMODE}")
            if self.PGCHANNELBINDING:
                options.append(f"channel_binding={self.PGCHANNELBINDING}")
            if options:
                url += "?" + "&".join(options)
            return url
            
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
