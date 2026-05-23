from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.devops.graph import build_devops_graph
from services.devops.state import DevOpsState
from services.devops.session_store import save_session   # optional persistence


router = APIRouter(
    prefix="/devops",
    tags=["devops-agents"],
)


class RunPipelineRequest(BaseModel):
    query: str
    namespace: Optional[str] = None
    session_id: Optional[str] = None


# Compile the graph once at startup
devops_graph = build_devops_graph()


@router.post("/run")
async def run_full_pipeline(req: RunPipelineRequest):
    """
    Runs the complete DevOps multi-agent pipeline using a real LangGraph StateGraph.

    This replaces the previous manual orchestration from the frontend.
    The graph handles:
      - Retrieval from Pinecone
      - Bug analysis + decision (has_bug)
      - Conditional execution (skip Fix if no bug)
      - Fix generation (if needed)
      - Final review
    """
    initial_state: DevOpsState = {
        "user_query": req.query.strip(),
        "namespace": req.namespace,
    }

    # Run the full graph
    final_state = await devops_graph.ainvoke(initial_state)

    # Optionally persist the final result in our session store
    if req.session_id:
        save_session(req.session_id, final_state)

    return {
        "query": req.query,
        "session_id": req.session_id,
        "final_state": final_state,
    }
