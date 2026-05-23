import logging
from typing import Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .state import DevOpsState

logger = logging.getLogger(__name__)


def _get_model():
    """Lazy creation of ChatOpenAI for reviewer."""
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1,
        max_tokens=1200,
    )


async def review(state: DevOpsState) -> dict[str, Any]:
    """
    Reviewer Agent node.
    Reviews the proposed fix critically using the full context from previous agents.
    """
    query = state.get("user_query", "").strip()
    retrieved_code = state.get("retrieved_code", "").strip()
    bug_analysis = state.get("bug_analysis", "").strip()
    generated_fix = state.get("generated_fix", "").strip()

    if not query:
        return {"review_feedback": "No query provided for review."}

    logger.info(f"[DEVOPS][REVIEWER] Reviewing fix for query: {query[:80]}...")

    system_prompt = (
        "You are a Code Reviewer agent in a DevOps pipeline. "
        "Review the work of previous agents.\n\n"
        "If the Analyzer concluded there is **no bug** (HAS_BUG: no), then give a positive review:\n"
        "✅ No bug found — the code is correct / the reported issue is not a real bug.\n"
        "Explain briefly why.\n\n"
        "If there was a proposed fix, review it normally with verdict + bullets.\n"
        "Start with your verdict on a single line."
    )

    context_parts = []
    if bug_analysis:
        context_parts.append(f"Root Cause Analysis:\n{bug_analysis}")
    if generated_fix:
        context_parts.append(f"Proposed Fix:\n{generated_fix}")
    if retrieved_code:
        context_parts.append(f"Original Code Context:\n{retrieved_code[:8000]}")

    context_section = "\n\n".join(context_parts) if context_parts else "No additional context available."

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(
            content=f"User query:\n{query}\n\n{context_section}\n\nPlease review the proposed fix."
        ),
    ]

    try:
        llm = _get_model()
        response = await llm.ainvoke(messages)
        content = response.content if isinstance(response.content, str) else str(response.content)
        logger.info("[DEVOPS][REVIEWER] Review completed successfully")
        return {"review_feedback": content}
    except Exception as exc:
        logger.exception(f"[DEVOPS][REVIEWER] Review failed: {exc}")
        return {"review_feedback": f"⚠️ Reviewer error: {str(exc)}"}
