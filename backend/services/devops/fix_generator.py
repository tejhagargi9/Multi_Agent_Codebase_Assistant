import logging
from typing import Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .state import DevOpsState

logger = logging.getLogger(__name__)


def _get_model():
    """Lazy creation of ChatOpenAI."""
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=5000,
    )


async def generate_fix(state: DevOpsState) -> dict[str, Any]:
    """
    Fix Generator Agent node.
    Takes user_query + retrieved_code + bug_analysis and proposes a concrete code fix.
    """
    query = state.get("user_query", "").strip()
    retrieved_code = state.get("retrieved_code", "").strip()
    bug_analysis = state.get("bug_analysis", "").strip()

    if not query:
        return {"generated_fix": "No query provided for fix generation."}

    logger.info(f"[DEVOPS][FIX-GENERATOR] Generating fix for query: {query[:80]}...")

    system_prompt = (
        "You are a Fix Generator agent in a DevOps pipeline. "
        "Your job: given a bug description, root cause analysis, and relevant code context, "
        "write a concrete, working code fix. "
        "Output the patched code in a markdown code block with the file path or function name as a header. "
        "Briefly explain (1-2 sentences) what changed and why. "
        "Be practical — prefer minimal, targeted fixes over rewrites. "
        "Start with \"Proposed fix:\" then the code block."
    )

    context_parts = []
    if bug_analysis:
        context_parts.append(f"Root Cause Analysis:\n{bug_analysis}")
    if retrieved_code:
        context_parts.append(f"Relevant Code Context:\n{retrieved_code[:10000]}")

    context_section = "\n\n".join(context_parts) if context_parts else "No additional context available."

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(
            content=f"User query / bug report:\n{query}\n\n{context_section}\n\nPlease provide the fix."
        ),
    ]

    try:
        llm = _get_model()
        response = await llm.ainvoke(messages)
        content = response.content if isinstance(response.content, str) else str(response.content)
        logger.info("[DEVOPS][FIX-GENERATOR] Fix generated successfully")
        return {"generated_fix": content}
    except Exception as exc:
        logger.exception(f"[DEVOPS][FIX-GENERATOR] Fix generation failed: {exc}")
        return {"generated_fix": f"⚠️ Fix Generator error: {str(exc)}"}
