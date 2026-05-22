import os
import logging
from functools import lru_cache
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_embeddings() -> OpenAIEmbeddings:
    """
    Initialize OpenAI embeddings with reduced dimension.
    Using text-embedding-3-small + dimensions=1024 to match the existing Pinecone index (1024 dims).
    """
    logger.info("[RAG] Initializing OpenAI embeddings (model=text-embedding-3-small, dimensions=1024)")
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        dimensions=1024,
    )


@lru_cache(maxsize=1)
def get_vector_store() -> PineconeVectorStore:
    """
    Initialize and return a PineconeVectorStore instance.
    Uses text-embedding-3-small with dimensions=1024 to match the existing index.
    Requires:
      - PINECONE_API_KEY
      - Either PINECONE_INDEX_NAME or PINECONE_HOST (host preferred for serverless)
    """
    api_key = os.environ.get("PINECONE_API_KEY")
    index_name = os.environ.get("PINECONE_INDEX_NAME")
    host = os.environ.get("PINECONE_HOST")

    logger.info("[RAG] get_vector_store() called (first time due to cache)")

    if not api_key:
        logger.error("[RAG] Missing PINECONE_API_KEY")
        raise RuntimeError("PINECONE_API_KEY is not set")

    if not host and not index_name:
        logger.error("[RAG] Neither PINECONE_INDEX_NAME nor PINECONE_HOST is set")
        raise RuntimeError("Either PINECONE_INDEX_NAME or PINECONE_HOST must be set")

    logger.info(f"[RAG] Connecting to Pinecone → index='{index_name}' | host='{host or 'auto-resolve'}' (using 1024-dim embeddings)")

    # Let LangChain + Pinecone SDK handle index creation.
    # Passing `host` directly to PineconeVectorStore is the cleanest way
    # and avoids the "Index host ignored when initializing with index object" warning.
    vector_store = PineconeVectorStore(
        embedding=get_embeddings(),
        index_name=index_name,
        pinecone_api_key=api_key,
        host=host,
    )

    logger.info("[RAG] ✅ PineconeVectorStore initialized successfully")
    return vector_store
