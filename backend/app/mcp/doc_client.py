"""
@fileoverview OpenPath Component
@module app/mcp/doc_client
@description MCP client to connect to the Documentation MCP server via stdio.
@dependencies [mcp, os, typing]
@stateConsumed []
@stateProduced []
"""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Define the server parameters to run the Documentation MCP server
# Using Upstash Context7 MCP for fetching contextual documentation
server_params = StdioServerParameters(
    command="npx",
    args=[
        "-y",
        "@upstash/context7-mcp"
    ],
    env={
        "CONTEXT7_API_KEY": os.environ.get("CONTEXT7_API_KEY", ""),
        "PATH": os.environ.get("PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin")
    }
)

@asynccontextmanager
async def get_doc_mcp_client() -> AsyncGenerator[ClientSession, None]:
    """
    Context manager that provides an initialized ClientSession
    connected to the Documentation MCP server.
    """
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            yield session
