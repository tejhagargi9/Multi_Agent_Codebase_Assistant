import tempfile
import zipfile
import os
import shutil
import logging
from pathlib import Path
from fastapi import UploadFile

logger = logging.getLogger(__name__)

IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", ".next", "dist", "build",
    "venv", ".venv", "env", ".env", "target", "out", ".idea", ".vscode",
    "coverage", ".pytest_cache", "tmp", "temp"
}

IGNORED_FILES = {
    ".env", ".gitignore", ".gitattributes", ".gitmodules", ".DS_Store",
    "Thumbs.db", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "Cargo.lock", ".env.local", ".env.development", ".env.production",
    ".eslintcache", ".prettierignore", "LICENSE", "license.md"
}

BINARY_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
    ".pdf", ".exe", ".dll", ".so", ".dylib", ".zip", ".tar", ".gz", ".bz2", ".7z",
    ".mp4", ".mov", ".avi", ".mp3", ".wav", ".flac",
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ".class", ".jar", ".war", ".pyc", ".pyo"
}

TEXT_EXTS = {
    ".txt", ".md", ".markdown", ".rst",
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".json", ".jsonc", ".json5",
    ".py", ".pyi", ".pyw",
    ".html", ".htm", ".xhtml", ".css", ".scss", ".sass", ".less",
    ".java", ".kt", ".kts", ".scala",
    ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx",
    ".cs", ".vb",
    ".go", ".rs", ".swift", ".m", ".mm",
    ".php", ".phtml",
    ".rb", ".rake",
    ".xml", ".xsl", ".xslt", ".svg",
    ".yml", ".yaml", ".toml", ".ini", ".conf", ".config",
    ".sh", ".bash", ".zsh", ".bat", ".cmd", ".ps1",
    ".sql", ".prisma", ".graphql", ".gql",
    ".dockerfile", ".env.example", ".editorconfig", ".prettierrc",
    ".eslintrc", ".babelrc", "makefile", ".make", ".cmake", "cmakelists.txt"
}

async def process_uploaded_zip(upload_file: UploadFile) -> dict:
    """
    Saves the uploaded zip to a temp file, extracts it, walks the tree with os.walk,
    skips ignored dirs/files, reads text content of code/text files, prints to console,
    prepares full documents for RAG, and returns analysis + raw documents.
    """
    filename = upload_file.filename or "unknown.zip"
    logger.info(f"[ZIP] Starting extraction + crawl for: {filename}")

    # Save uploaded file to temporary zip
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_zip:
        file_content = await upload_file.read()
        tmp_zip.write(file_content)
        tmp_zip_path = tmp_zip.name

    extract_dir = tempfile.mkdtemp(prefix="zip_extract_")
    analyzed_files = []
    documents_for_rag = []
    skipped_count = 0
    total_files_seen = 0

    try:
        # Extract the zip safely
        with zipfile.ZipFile(tmp_zip_path, "r") as zip_ref:
            # Prevent zip slip
            for member in zip_ref.infolist():
                if member.is_dir():
                    continue
                # simple path check
                if ".." in member.filename or member.filename.startswith("/"):
                    continue
            zip_ref.extractall(extract_dir)

        # Walk and process
        for root, dirs, filenames in os.walk(extract_dir):
            # Prune ignored directories in-place (os.walk respects this)
            dirs[:] = [
                d for d in dirs
                if d not in IGNORED_DIRS and not d.startswith(".")
            ]

            for filename in filenames:
                total_files_seen += 1

                # Skip ignored files
                if filename in IGNORED_FILES or filename.startswith("."):
                    skipped_count += 1
                    continue

                ext = Path(filename).suffix.lower()
                if ext in BINARY_EXTS:
                    skipped_count += 1
                    continue

                # Only process likely text files
                if ext and ext not in TEXT_EXTS and ext != "":
                    # Unknown ext - still try, but many binaries caught above
                    pass

                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, extract_dir).replace("\\", "/")

                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()

                    # Skip very large files (prevent memory issues / huge responses)
                    MAX_CONTENT = 300_000
                    if len(content) > MAX_CONTENT:
                        content = content[:MAX_CONTENT] + "\n\n... [file truncated, was " + str(len(content)) + " chars]"

                    # PRINT to backend console as requested
                    print(f"\n{'='*60}")
                    print(f"FILE: {rel_path}")
                    print(f"SIZE: {len(content)} chars | SOURCE: {upload_file.filename}")
                    print(f"{'='*60}")
                    print(content)
                    print(f"{'='*60}\n")

                    # Prepare preview for UI (first ~700 chars)
                    preview = content[:700]
                    if len(content) > 700:
                        preview += "\n... [truncated for display]"

                    analyzed_files.append({
                        "path": rel_path,
                        "size": len(content),
                        "preview": preview
                    })

                    # Full content for RAG indexing (prepare step)
                    documents_for_rag.append({
                        "path": rel_path,
                        "content": content,
                        "zip_name": upload_file.filename,
                    })

                except Exception as read_err:
                    skipped_count += 1
                    print(f"[WARN] Could not read {rel_path}: {read_err}")

        logger.info(f"[ZIP] Crawl complete — analyzed={len(analyzed_files)}, skipped={skipped_count}, rag_docs={len(documents_for_rag)}")

        return {
            "zip_name": upload_file.filename,
            "original_size": len(file_content),
            "files_analyzed": len(analyzed_files),
            "skipped_files": skipped_count,
            "total_files_in_archive": total_files_seen,
            "files": analyzed_files,
            "documents": documents_for_rag,   # for RAG pipeline (chunk → embed → vector DB)
        }

    except zipfile.BadZipFile:
        raise ValueError(f"{upload_file.filename} is not a valid zip archive")
    except Exception as e:
        raise e
    finally:
        # Always clean up temp files
        try:
            if os.path.exists(tmp_zip_path):
                os.unlink(tmp_zip_path)
        except Exception:
            pass
        try:
            if os.path.exists(extract_dir):
                shutil.rmtree(extract_dir, ignore_errors=True)
        except Exception:
            pass
