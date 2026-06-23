"""
Detective Agent implementation using native LangGraph ToolNode.
"""
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import SystemMessage

from core.llm import get_llm
from agents.prompts import DETECTIVE_PROMPT
from agents.tools import search_web

class MessagesState(TypedDict):
    messages: Annotated[list, add_messages]

def create_detective_agent():
    """Builds and compiles the React agent graph for the Detective."""
    llm = get_llm()
    # The detective might need to search the web to figure out what context is missing, 
    # but mainly it asks questions. We give it the search tool just in case.
    tools = [search_web]
    llm_with_tools = llm.bind_tools(tools)
    
    def call_model(state: MessagesState):
        messages = state['messages']
        # Inject the system prompt implicitly
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=DETECTIVE_PROMPT)] + messages
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    builder = StateGraph(MessagesState)
    builder.add_node("detective_model", call_model)
    builder.add_node("tools", ToolNode(tools))
    
    builder.add_edge(START, "detective_model")
    builder.add_conditional_edges("detective_model", tools_condition)
    builder.add_edge("tools", "detective_model")
    
    return builder.compile()
