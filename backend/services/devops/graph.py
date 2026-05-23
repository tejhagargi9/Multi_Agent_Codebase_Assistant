from langgraph.graph import StateGraph, END

from .state import DevOpsState
from .retriever import retrieve
from .analyzer import analyze
from .fix_generator import generate_fix
from .reviewer import review


def should_continue_after_analysis(state: DevOpsState) -> str:
    """
    Conditional edge after the Analyzer node.
    If the Analyzer decided there is no real bug, skip directly to Review.
    """
    if state.get("has_bug") is False:
        return "review"
    return "fix"


def build_devops_graph():
    """
    Builds the full DevOps multi-agent workflow as a LangGraph StateGraph.
    """
    workflow = StateGraph(DevOpsState)

    # Register nodes
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("analyze", analyze)
    workflow.add_node("fix", generate_fix)
    workflow.add_node("review", review)

    # Define the flow
    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "analyze")

    # Conditional routing based on Analyzer decision
    workflow.add_conditional_edges(
        "analyze",
        should_continue_after_analysis,
        {
            "fix": "fix",
            "review": "review",
        },
    )

    workflow.add_edge("fix", "review")
    workflow.add_edge("review", END)

    # Compile the graph
    app = workflow.compile()
    return app
