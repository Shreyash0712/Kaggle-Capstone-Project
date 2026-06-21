"""
@fileoverview OpenPath Component
@module app/mcp/github_client
@description MCP client to connect to the GitHub MCP server via stdio using Docker.
@dependencies [mcp, os, typing]
@stateConsumed []
@stateProduced []
"""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

@asynccontextmanager
async def get_github_mcp_client() -> AsyncGenerator[ClientSession, None]:
    """
    Context manager that provides an initialized ClientSession
    connected to the GitHub MCP server.
    """
    from app.core.config import settings
    
    server_params = StdioServerParameters(
        command="docker",
        args=[
            "run",
            "-i",
            "--rm",
            "-e",
            "GITHUB_PERSONAL_ACCESS_TOKEN",
            "ghcr.io/github/github-mcp-server"
        ],
        env={
            "GITHUB_PERSONAL_ACCESS_TOKEN": settings.GITHUB_PERSONAL_ACCESS_TOKEN or "",
            "PATH": os.environ.get("PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin")
        }
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            yield session
