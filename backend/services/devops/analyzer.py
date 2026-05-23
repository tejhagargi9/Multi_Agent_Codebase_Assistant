import logging
from typing import Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .state import DevOpsState

logger = logging.getLogger(__name__)


def _get_model():
    """Lazy creation of ChatOpenAI so the module can be imported without OPENAI_API_KEY."""
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1,
        max_tokens=1200,
    )


async def analyze(state: DevOpsState) -> dict[str, Any]:
    """
    Bug Analyzer Agent node.
    Takes user_query + retrieved_code and produces a sharp root cause analysis.
    """
    query = state.get("user_query", "").strip()
    retrieved_code = state.get("retrieved_code", "").strip()

    if not query:
        return {"bug_analysis": "No query provided for analysis."}

    logger.info(f"[DEVOPS][ANALYZER] Analyzing query: {query[:80]}... (retrieved_context_len={len(retrieved_code)})")

    system_prompt = (
        "You are a Bug Analyzer agent in a DevOps pipeline. "
        "Your job: given a developer's bug report and relevant code context, "
        "decide if there is a **real, actionable bug** that needs a code fix.\n\n"
        "First, output on the very first line:\n"
        "HAS_BUG: yes   (if there is a genuine bug that should be fixed)\n"
        "HAS_BUG: no    (if the code is correct, the issue is user error, misunderstanding, or no bug exists)\n\n"
        "Then provide your analysis.\n"
        "If HAS_BUG: no, clearly explain why the code is actually fine.\n"
        "Be honest and strict — do not invent bugs."
    )

    context_section = (
        f"\n\nRelevant code context from the codebase:\n{retrieved_code[:12000]}"
        if retrieved_code
        else "\n(No code context was retrieved for this query.)"
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(
            content=f"User query / bug report:\n{query}{context_section}"
        ),
    ]

    try:
        llm = _get_model()
        response = await llm.ainvoke(messages)
        content = response.content if isinstance(response.content, str) else str(response.content)

        # Parse the decision
        first_line = content.split("\n")[0].strip().upper()
        has_bug = "HAS_BUG: YES" in first_line

        logger.info(f"[DEVOPS][ANALYZER] Analysis done — has_bug={has_bug}")

        return {
            "bug_analysis": content,
            "has_bug": has_bug
        }
    except Exception as exc:
        logger.exception(f"[DEVOPS][ANALYZER] Analysis failed: {exc}")
        return {
            "bug_analysis": f"⚠️ Analyzer error: {str(exc)}",
            "has_bug": True   # default to running the rest of the pipeline on error
        }
