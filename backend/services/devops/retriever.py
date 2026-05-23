import logging
from typing import Any

from .state import DevOpsState
from ..rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)


async def retrieve(state: DevOpsState) -> dict[str, Any]:
    query = state.get("user_query", "").strip()
    if not query:
        logger.warning("[DEVOPS][RETRIEVER] Empty user_query — skipping retrieval")
        return {"retrieved_code": ""}

    namespace = state.get("namespace")

    logger.info(f"[DEVOPS][RETRIEVER] Starting retrieval for query: {query[:100]}... (namespace={namespace or 'default'})")

    try:
        vector_store = get_vector_store()

        docs = await vector_store.asimilarity_search(
            query,
            k=15,
            namespace=namespace,
        )

        if not docs:
            logger.info("[DEVOPS][RETRIEVER] No relevant chunks found in Pinecone")
            return {"retrieved_code": ""}

        formatted_chunks: list[str] = []
        for idx, doc in enumerate(docs, start=1):
            source = doc.metadata.get("source", "unknown_file")
            zip_name = doc.metadata.get("zip_name", "")
            header = f"[{source}]" + (f" (from {zip_name})" if zip_name else "")
            content = doc.page_content.strip()
            formatted_chunks.append(f"### Chunk {idx} — {header}\n{content}")

        retrieved_code = "\n\n".join(formatted_chunks)

        logger.info(f"[DEVOPS][RETRIEVER] Retrieved {len(docs)} chunks from Pinecone")
        return {"retrieved_code": retrieved_code}

    except Exception as exc:
        logger.exception(f"[DEVOPS][RETRIEVER] Retrieval failed: {exc}")
        return {"retrieved_code": f"⚠️ Retrieval error: {str(exc)}"}
