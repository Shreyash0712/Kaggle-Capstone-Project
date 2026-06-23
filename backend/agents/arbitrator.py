"""
Arbitrator Agent implementation returning a structured Scorecard.
"""
from typing import Annotated, List, Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage

from core.llm import get_llm
from agents.prompts import ARBITRATOR_PROMPT

class Scorecard(BaseModel):
    advocate_score: int = Field(description="Score for the Advocate, starting at 50.")
    challenger_score: int = Field(description="Score for the Challenger, starting at 50. Must sum to 100 with advocate_score.")
    effective_summary: str = Field(description="Summary of the leading agent's points that the losing agent failed to overcome.")
    confidence_score: int = Field(description="Confidence in this verdict (0-100). Lower if there are many unknown variables.")
    key_vulnerabilities: List[str] = Field(description="Top 1-3 risks or flaws identified.")
    key_opportunities: List[str] = Field(description="Top 1-3 benefits or upside opportunities identified.")
    verdict: Literal["Proceed", "Pivot", "Abandon", "Undecided"] = Field(description="The current overall recommendation.")
    unanswered_variables: List[str] = Field(description="Key open questions or unknowns blocking a fully confident decision.")

def create_arbitrator_agent():
    """Builds the chain for the Arbitrator."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(Scorecard)
    
    def invoke_arbitrator(messages: list):
        # Inject the system prompt implicitly if not present
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=ARBITRATOR_PROMPT)] + messages
        return structured_llm.invoke(messages)
        
    return invoke_arbitrator
