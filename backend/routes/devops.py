from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.devops.retriever import retrieve
from services.devops.analyzer import analyze
from services.devops.state import DevOpsState
from services.devops.session_store import get_session, save_session, update_session

router = APIRouter(
    prefix="/devops",
    tags=["devops-agents"],
)


class RetrieveRequest(BaseModel):
    query: str
    namespace: Optional[str] = None
    session_id: Optional[str] = None   # roundId from frontend for shared state


@router.post("/retrieve")
async def devops_retrieve(req: RetrieveRequest):
    """
    Real RAG retriever for the DevOps agent pipeline.
    Stores the result in the shared DevOpsState so later agents (analyzer, etc.)
    can read the retrieved_code without the frontend having to pass it manually.
    """
    state: DevOpsState = {
        "user_query": req.query.strip(),
        "namespace": req.namespace,
    }
    result = await retrieve(state)

    retrieved_code = result.get("retrieved_code", "")

    # Persist into the session so the next agent can read it via shared state
    if req.session_id:
        save_session(req.session_id, {
            "user_query": req.query.strip(),
            "namespace": req.namespace,
            "retrieved_code": retrieved_code,
        })

    return {
        "query": req.query,
        "namespace": req.namespace,
        "retrieved_code": retrieved_code,
        "session_id": req.session_id,
    }


class AnalyzeRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    retrieved_code: Optional[str] = None   # fallback if no session


@router.post("/analyze")
async def devops_analyze(req: AnalyzeRequest):
    """
    Bug Analyzer agent.
    Pulls `retrieved_code` from the shared DevOpsState (populated by the retriever
    for the same session_id) so we properly respect the pipeline state.
    """
    retrieved_code = req.retrieved_code or ""

    if req.session_id:
        stored = get_session(req.session_id)
        if stored and stored.get("retrieved_code"):
            retrieved_code = stored["retrieved_code"]

    state: DevOpsState = {
        "user_query": req.query.strip(),
        "retrieved_code": retrieved_code,
    }
    result = await analyze(state)
    return {
        "query": req.query,
        "bug_analysis": result.get("bug_analysis", ""),
        "session_id": req.session_id,
    }
