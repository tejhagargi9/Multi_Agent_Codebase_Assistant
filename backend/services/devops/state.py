from typing import Optional, TypedDict


class DevOpsState(TypedDict, total=False):  # total=False allows incremental population by LangGraph nodes
    """
    Shared state for the DevOps / Code Assistant multi-agent workflow.

    This state is passed between nodes in the LangGraph (or any agent orchestrator).
    It holds the full lifecycle of a user request:

    - user_query: The original question from the developer (e.g. "Why is login failing?")
    - namespace: Optional Pinecone namespace (project name from uploaded zip) for scoped retrieval
    - retrieved_code: Relevant code snippets retrieved from Pinecone RAG (namespaced per project)
    - bug_analysis: Analysis of the bug / root cause (done by Bug Analyzer agent)
    - generated_fix: Proposed code fix or patch (done by Fix Generator agent)
    - review_feedback: Code review comments and suggestions (done by Reviewer agent)
    - final_response: Polished, user-facing final answer
    """
    """
    Shared state for the DevOps / Code Assistant multi-agent workflow.

    This state is passed between nodes in the LangGraph (or any agent orchestrator).
    It holds the full lifecycle of a user request:

    - user_query: The original question from the developer (e.g. "Why is login failing?")
    - retrieved_code: Relevant code snippets retrieved from Pinecone RAG (namespaced per project)
    - bug_analysis: Analysis of the bug / root cause (done by Bug Analyzer agent)
    - generated_fix: Proposed code fix or patch (done by Fix Generator agent)
    - review_feedback: Code review comments and suggestions (done by Reviewer agent)
    - final_response: Polished, user-facing final answer
    """

    user_query: str
    namespace: Optional[str]
    retrieved_code: str
    bug_analysis: str
    has_bug: bool
    generated_fix: str
    review_feedback: str
    final_response: str
