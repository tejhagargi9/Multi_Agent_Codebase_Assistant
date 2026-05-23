import logging
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from .vector_store import get_vector_store

logger = logging.getLogger(__name__)


def build_langchain_documents(raw_files: list[dict]) -> list[Document]:
    """
    Convert raw crawled file dicts into LangChain Document objects.

    Expected input format (one per file):
    {
        "path": "relative/path/to/file.py",
        "content": "full file text...",
        "zip_name": "project.zip"
    }
    """
    logger.info(f"[RAG] Preparing LangChain Documents from {len(raw_files)} raw files...")
    documents: list[Document] = []

    for item in raw_files:
        page_content = item.get("content", "")
        if not page_content or not page_content.strip():
            continue

        metadata = {
            "source": item.get("path"),
            "zip_name": item.get("zip_name"),
        }
        documents.append(Document(page_content=page_content, metadata=metadata))

    logger.info(f"[RAG] ✅ Prepared {len(documents)} LangChain Documents")
    return documents


def index_documents(raw_files: list[dict], namespace: str | None = None) -> dict:
    """
    Full RAG indexing pipeline for a batch of crawled files:

    1. Prepare → wrap as LangChain Documents
    2. Chunk   → RecursiveCharacterTextSplitter (1000/200)
    3. Embed   → OpenAI text-embedding-3-small (1024 dims, to match existing Pinecone index)
    4. Store   → Pinecone via LangChain PineconeVectorStore (in the given namespace)

    If namespace is provided, all vectors will be stored under that Pinecone namespace
    (e.g. the project/folder name from the zip).

    Returns stats about what was indexed (including namespace used).
    """
    namespace_label = namespace or "default"
    logger.info(f"[RAG] Starting indexing pipeline for {len(raw_files)} files → namespace='{namespace_label}'")

    if not raw_files:
        logger.warning("[RAG] No raw files provided for indexing")
        return {"chunks_indexed": 0, "documents_processed": 0, "namespace": namespace_label}

    # 1. Prepare documents
    documents = build_langchain_documents(raw_files)

    if not documents:
        logger.warning("[RAG] All documents were empty after filtering")
        return {"chunks_indexed": 0, "documents_processed": 0, "namespace": namespace_label}

    # 2. Chunk
    logger.info("[RAG] Chunking documents with RecursiveCharacterTextSplitter (1000/200)...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=250,
        add_start_index=True,
    )
    all_splits = text_splitter.split_documents(documents)
    logger.info(f"[RAG] ✅ Chunked into {len(all_splits)} sub-documents")

    # 3 + 4. Embed + Store (automatic inside add_documents)
    logger.info(f"[RAG] Getting vector store and upserting chunks to Pinecone (namespace='{namespace_label}')...")
    vector_store = get_vector_store()

    if namespace:
        vector_store.add_documents(all_splits, namespace=namespace)
    else:
        vector_store.add_documents(all_splits)

    logger.info(f"[RAG] ✅ Successfully upserted {len(all_splits)} chunks to Pinecone namespace='{namespace_label}'")

    return {
        "chunks_indexed": len(all_splits),
        "documents_processed": len(documents),
        "namespace": namespace_label,
    }
