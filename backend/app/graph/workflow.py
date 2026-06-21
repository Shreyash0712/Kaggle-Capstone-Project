"""
@fileoverview OpenPath Component
@module app/graph/workflow
@description Defines and compiles the LangGraph state machine workflow.
@dependencies [langgraph, app.core.state, app.graph.nodes.*]
@stateConsumed [OpenPathState]
@stateProduced [OpenPathState]
"""
from langgraph.graph import StateGraph, START, END
from app.core.state import OpenPathState
from app.graph.nodes import (
    profile_agent_node,
    discovery_agent_node,
    difficulty_agent_node,
    learning_gap_agent_node,
    doc_expert_agent_node,
    mentor_agent_node
)

def build_graph() -> StateGraph:
    workflow = StateGraph(OpenPathState)
    
    # Add nodes
    workflow.add_node("profile_agent", profile_agent_node)
    workflow.add_node("discovery_agent", discovery_agent_node)
    workflow.add_node("difficulty_agent", difficulty_agent_node)
    workflow.add_node("learning_gap_agent", learning_gap_agent_node)
    workflow.add_node("doc_expert_agent", doc_expert_agent_node)
    workflow.add_node("mentor_agent", mentor_agent_node)
    
    # Add edges
    workflow.add_edge(START, "profile_agent")
    workflow.add_edge("profile_agent", "discovery_agent")
    
    # Conditional edge from discovery to either mentor or parallel split
    def route_after_discovery(state: OpenPathState):
        if not state.get("discovered_repos"):
            return "mentor_agent"
        return ["difficulty_agent", "learning_gap_agent"]
    
    workflow.add_conditional_edges(
        "discovery_agent",
        route_after_discovery,
        {
            "mentor_agent": "mentor_agent",
            "difficulty_agent": "difficulty_agent",
            "learning_gap_agent": "learning_gap_agent"
        }
    )
    
    # Join parallel nodes to doc expert
    workflow.add_edge(["difficulty_agent", "learning_gap_agent"], "doc_expert_agent")
    
    # Doc expert to mentor
    workflow.add_edge("doc_expert_agent", "mentor_agent")
    
    # End
    workflow.add_edge("mentor_agent", END)
    
    return workflow

def get_compiled_graph(checkpointer=None):
    workflow = build_graph()
    return workflow.compile(checkpointer=checkpointer)
