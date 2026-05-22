from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from services.zip_processor import process_uploaded_zip

router = APIRouter(
    prefix="/upload",
    tags=["zip-upload"]
)

@router.post("/zips")
async def upload_zips(files: List[UploadFile] = File(..., description="One or more .zip project archives to analyze")):
    """
    Accepts multiple .zip files (project folders), extracts each, crawls with os.walk,
    skips node_modules / .git / .env etc., prints file contents to server console,
    and returns analysis results + previews to the frontend.
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")

    results = []
    for upload_file in files:
        filename = upload_file.filename or "unknown.zip"
        content_type = upload_file.content_type or ""

        # Basic validation
        is_zip = filename.lower().endswith(".zip") or content_type in {
            "application/zip",
            "application/x-zip-compressed",
            "application/octet-stream"
        }

        if not is_zip:
            results.append({
                "zip_name": filename,
                "error": "File is not a .zip archive"
            })
            continue

        try:
            result = await process_uploaded_zip(upload_file)
            results.append(result)
        except Exception as exc:
            results.append({
                "zip_name": filename,
                "error": str(exc)
            })

    return {
        "success": True,
        "total_zips": len(files),
        "results": results
    }
