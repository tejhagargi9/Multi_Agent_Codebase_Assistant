import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from services.zip_processor import process_uploaded_zip
from services.rag.indexer import index_documents

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/upload",
    tags=["zip-upload"]
)

@router.post("/zips")
async def upload_zips(files: List[UploadFile] = File(..., description="One or more .zip project archives to analyze")):
    """
    Accepts multiple .zip files (project folders), extracts each, crawls with os.walk,
    skips node_modules / .git / .env etc., prints file contents to server console,
    runs RAG indexing (chunk → OpenAI embeddings → Pinecone), and returns analysis + indexing stats.
    """
    if not files or len(files) == 0:
        logger.warning("[UPLOAD] No files received in /upload/zips")
        raise HTTPException(status_code=400, detail="No files uploaded")

    logger.info(f"[UPLOAD] Received {len(files)} zip file(s) for processing + RAG indexing")

    results = []
    for upload_file in files:
        filename = upload_file.filename or "unknown.zip"
        content_type = upload_file.content_type or ""

        logger.info(f"[UPLOAD] → Processing zip: {filename}")

        # Basic validation
        is_zip = filename.lower().endswith(".zip") or content_type in {
            "application/zip",
            "application/x-zip-compressed",
            "application/octet-stream"
        }

        if not is_zip:
            logger.warning(f"[UPLOAD] Rejected non-zip file: {filename}")
            results.append({
                "zip_name": filename,
                "error": "File is not a .zip archive"
            })
            continue

        try:
            result = await process_uploaded_zip(upload_file)
            logger.info(f"[UPLOAD] Crawling complete for {filename} — {result.get('files_analyzed', 0)} files analyzed")

            # === RAG INDEXING PIPELINE ===
            # Prepare → Chunk (Recursive 1000/200) → Embed (OpenAI) → Store (Pinecone)
            # Use zip filename (without .zip) as Pinecone namespace for project isolation
            zip_name = result.get("zip_name", filename)
            namespace = zip_name.rsplit(".", 1)[0] if "." in zip_name else zip_name

            docs = result.get("documents", [])
            if docs:
                logger.info(f"[UPLOAD] Triggering RAG indexing for {filename} ({len(docs)} documents) → namespace='{namespace}'")
                try:
                    indexing_result = index_documents(docs, namespace=namespace)
                    result["rag_indexing"] = indexing_result
                    logger.info(f"[UPLOAD] RAG indexing done for {filename} (namespace='{namespace}'): {indexing_result}")
                except Exception as idx_err:
                    logger.error(f"[UPLOAD] RAG indexing FAILED for {filename} (namespace='{namespace}'): {idx_err}")
                    result["rag_indexing"] = {"error": str(idx_err), "namespace": namespace}
            else:
                logger.info(f"[UPLOAD] No documents to index from {filename}")

            results.append(result)

        except Exception as exc:
            logger.error(f"[UPLOAD] Failed to process {filename}: {exc}")
            results.append({
                "zip_name": filename,
                "error": str(exc)
            })

    logger.info("[UPLOAD] All zips processed. Returning results to client.")
    return {
        "success": True,
        "total_zips": len(files),
        "results": results
    }

    return {
        "success": True,
        "total_zips": len(files),
        "results": results
    }
