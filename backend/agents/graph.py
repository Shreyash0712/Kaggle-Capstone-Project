"""
LangGraph scaffolding for the Aletheox multi-agent system.
"""
from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessage, HumanMessage

from agents.advocate import create_advocate_agent
from agents.challenger import create_challenger_agent
from agents.detective import create_detective_agent
from agents.arbitrator import create_arbitrator_agent

# Initialize the agents
advocate_agent = create_advocate_agent()
challenger_agent = create_challenger_agent()
detective_agent = create_detective_agent()
arbitrator_agent = create_arbitrator_agent()

# Define the state schema
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    advocate_argument: str
    challenger_argument: str
    detective_questions: str
    scorecard: dict

from langchain_core.runnables import RunnableConfig

async def advocate_node(state: AgentState, config: RunnableConfig):
    """The Advocate generates arguments supporting the premise."""
    # We pass the config to ensure tracing and streaming propagates
    result = await advocate_agent.ainvoke({"messages": state["messages"]}, config)
    return {"advocate_argument": result["messages"][-1].content}

async def challenger_node(state: AgentState, config: RunnableConfig):
    """The Challenger identifies risks and flaws."""
    result = await challenger_agent.ainvoke({"messages": state["messages"]}, config)
    return {"challenger_argument": result["messages"][-1].content}

async def detective_node(state: AgentState, config: RunnableConfig):
    """The Detective gathers unknown variables."""
    result = await detective_agent.ainvoke({"messages": state["messages"]}, config)
    return {"detective_questions": result["messages"][-1].content}

async def arbitrator_node(state: AgentState, config: RunnableConfig):
    """The Arbitrator continuously updates the scorecard."""
    temp_messages = list(state["messages"])
    temp_messages.append(AIMessage(content=f"[Advocate Argument]\n{state.get('advocate_argument', '')}"))
    temp_messages.append(AIMessage(content=f"[Challenger Argument]\n{state.get('challenger_argument', '')}"))
    temp_messages.append(AIMessage(content=f"[Detective Context Questions]\n{state.get('detective_questions', '')}"))
    
    prev_scorecard = state.get("scorecard", {"advocate_score": 50, "challenger_score": 50})
    temp_messages.append(AIMessage(content=f"[Previous Scorecard]\n{prev_scorecard}"))
    
    # arbitrator_agent is a simple function returning a Pydantic model
    scorecard_result = arbitrator_agent(temp_messages)
    return {"scorecard": scorecard_result.dict()}

def build_graph():
    """Builds and compiles the LangGraph."""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("advocate", advocate_node)
    workflow.add_node("challenger", challenger_node)
    workflow.add_node("detective", detective_node)
    workflow.add_node("arbitrator", arbitrator_node)
    
    # Run all three agents in parallel from START
    workflow.add_edge(START, "advocate")
    workflow.add_edge(START, "challenger")
    workflow.add_edge(START, "detective")
    
    # They all automatically flow to arbitrator when finished
    workflow.add_edge("advocate", "arbitrator")
    workflow.add_edge("challenger", "arbitrator")
    workflow.add_edge("detective", "arbitrator")
    
    workflow.add_edge("arbitrator", END)
    
    return workflow.compile()

# The compiled graph instance
graph = build_graph()
