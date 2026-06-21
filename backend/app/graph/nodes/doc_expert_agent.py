"""
@fileoverview OpenPath Component
@module app/graph/nodes/doc_expert_agent
@description Implements Node E: Documentation Expert Agent using the Documentation MCP. Finds relevant documentation links for identified learning gaps as part of A2A delegation.
@dependencies [app.core.state, app.mcp.doc_client]
@stateConsumed [learning_gaps]
@stateProduced [learning_gaps]
"""
import json
from typing import Dict, Any

from app.core.state import OpenPathState
from app.mcp.doc_client import get_doc_mcp_client

async def doc_expert_agent_node(state: OpenPathState) -> Dict[str, Any]:
    """
    Node E: Documentation Expert Agent.
    Receives learning gaps and finds relevant official documentation links
    by querying the Documentation MCP server.
    """
    gaps = state.get("learning_gaps", [])
    if not gaps:
        return {"learning_gaps": []}

    enriched_gaps = []
    
    try:
        async with get_doc_mcp_client() as session:
            for gap in gaps:
                # Query the Upstash Context7 MCP server for documentation context
                try:
                    result = await session.call_tool("context7_search", {"query": f"{gap} official documentation context"})
                    
                    # Parse the MCP response to extract a link
                    # Fallback string if parsing fails or structure is different
                    link = "Documentation link found via MCP."
                    if result and result.content:
                        # Depending on the MCP server output structure, extract the text/link
                        link = str(result.content[0].text) if hasattr(result.content[0], 'text') else str(result.content)
                        
                    enriched_gaps.append({
                        "gap": gap,
                        "link": link
                    })
                except Exception as e:
                    enriched_gaps.append({
                        "gap": gap,
                        "link": f"Failed to fetch via MCP: {str(e)}"
                    })
    except Exception as connection_error:
        # Fallback if MCP server fails to connect
        enriched_gaps = [{"gap": gap, "link": f"MCP Connection Error: {str(connection_error)}"} for gap in gaps]
        
    return {"learning_gaps": enriched_gaps}
