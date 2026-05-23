from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.devops.retriever import retrieve
from services.devops.state import DevOpsState

router = APIRouter(
    prefix="/devops",
    tags=["devops-agents"],
)


class RetrieveRequest(BaseModel):
    query: str
    namespace: Optional[str] = None


@router.post("/retrieve")
async def devops_retrieve(req: RetrieveRequest):
    """
    Real RAG retriever for the DevOps agent pipeline.
    Called by the frontend when the first agent (Code Retriever) runs.
    """
    state: DevOpsState = {
        "user_query": req.query.strip(),
        "namespace": req.namespace,
    }
    result = await retrieve(state)
    return {
        "query": req.query,
        "namespace": req.namespace,
        "retrieved_code": result.get("retrieved_code", ""),
    }
