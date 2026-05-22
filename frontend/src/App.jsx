import { useState, useRef, useCallback } from "react";

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const FileIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="4" width="24" height="32" rx="3" fill="#1a1a2e" stroke="#4f46e5" strokeWidth="1.5"/>
    <path d="M32 4L40 12H32V4Z" fill="#4f46e5" opacity="0.6"/>
    <path d="M32 4V12H40" stroke="#4f46e5" strokeWidth="1.5" fill="none"/>
    <rect x="14" y="20" width="8" height="2" rx="1" fill="#4f46e5" opacity="0.7"/>
    <rect x="14" y="24" width="14" height="2" rx="1" fill="#4f46e5" opacity="0.5"/>
    <rect x="14" y="28" width="10" height="2" rx="1" fill="#4f46e5" opacity="0.5"/>
    <path d="M28 34L36 42M36 34L28 42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0"/>
  </svg>
);

const ZipBadge = () => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-widest"
    style={{ background: "rgba(79,70,229,0.12)", color: "#818cf8", border: "1px solid rgba(79,70,229,0.25)" }}>
    .ZIP
  </div>
);

const ProgressBar = ({ progress }) => (
  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #4f46e5, #818cf8)",
        boxShadow: "0 0 8px rgba(79,70,229,0.6)"
      }}
    />
  </div>
);

const FileCard = ({ file, onRemove, uploadProgress }) => {
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;
  const isDone = uploadProgress === 100;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.2)" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M11 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8l-6-6z" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
          <path d="M11 2v6h6" stroke="#818cf8" strokeWidth="1.5" fill="none"/>
          <path d="M8 13h1v-2h2v2h1l-2 2-2-2z" fill="#818cf8"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>{file.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs" style={{ color: "#64748b" }}>{formatBytes(file.size)}</span>
          {isUploading && <span className="text-xs" style={{ color: "#818cf8" }}>{uploadProgress}%</span>}
          {isDone && (
            <span className="text-xs flex items-center gap-1" style={{ color: "#34d399" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Uploaded
            </span>
          )}
        </div>
        {(isUploading || isDone) && (
          <div className="mt-2">
            <ProgressBar progress={uploadProgress} />
          </div>
        )}
      </div>

      {!isUploading && (
        <button onClick={() => onRemove(file.name)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ color: "#64748b" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default function App() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const inputRef = useRef(null);

  const validateAndAdd = (newFiles) => {
    setError("");
    const valid = [];
    const invalid = [];

    Array.from(newFiles).forEach(f => {
      if (f.name.endsWith(".zip") || f.type === "application/zip" || f.type === "application/x-zip-compressed") {
        if (!files.find(existing => existing.name === f.name)) valid.push(f);
      } else {
        invalid.push(f.name);
      }
    });

    if (invalid.length) setError(`Only .zip files allowed. Skipped: ${invalid.join(", ")}`);
    if (valid.length) {
      setUploadResults(null);
      setFiles(prev => [...prev, ...valid]);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAdd(e.dataTransfer.files);
  }, [files]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = (name) => {
    setFiles(prev => prev.filter(f => f.name !== name));
    setUploadProgress(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const uploadToBackend = async () => {
    if (!files.length) return;
    setIsUploading(true);
    setError("");
    setUploadResults(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("http://127.0.0.1:8000/upload/zips", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setUploadResults(data);

      // Save the last used Pinecone namespace to localStorage (key = "namespace")
      // This comes from the backend after successful RAG indexing (derived from zip/folder name)
      if (data.results && data.results.length > 0) {
        const lastResult = data.results[data.results.length - 1];
        const namespace = lastResult?.rag_indexing?.namespace;
        if (namespace) {
          localStorage.setItem("namespace", namespace);
          console.log("[Frontend] Saved namespace to localStorage:", namespace);
        }
      }

      // Mark all files as 100% complete in the UI
      const completed = {};
      files.forEach((f) => {
        completed[f.name] = 100;
      });
      setUploadProgress(completed);
    } catch (err) {
      setError(
        `Upload / analysis failed: ${err.message}. Make sure the FastAPI backend is running on port 8000.`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const allDone = files.length > 0 && files.every(f => uploadProgress[f.name] === 100);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#0b0b14", fontFamily: "'DM Sans', sans-serif" }}>

      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12V4a1 1 0 011-1h4l2 2h4a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="text-sm font-medium tracking-wide" style={{ color: "#818cf8" }}>Project Upload</span>
          </div>
          <h1 className="text-3xl font-semibold mb-3" style={{ color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            Upload your project
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            Drop your compressed project files here. We support <ZipBadge /> archives up to 500 MB.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && inputRef.current?.click()}
          className="relative rounded-2xl cursor-pointer transition-all duration-300 mb-4 overflow-hidden"
          style={{
            border: isDragging
              ? "1.5px dashed #4f46e5"
              : "1.5px dashed rgba(255,255,255,0.1)",
            background: isDragging
              ? "rgba(79,70,229,0.06)"
              : "rgba(255,255,255,0.02)",
            minHeight: "200px",
          }}>

          {isDragging && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(79,70,229,0.1) 0%, transparent 70%)" }} />
          )}

          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="mb-5 transition-transform duration-200" style={{ transform: isDragging ? "scale(1.1)" : "scale(1)" }}>
              <FileIcon />
            </div>

            <p className="text-sm font-medium mb-1" style={{ color: isDragging ? "#818cf8" : "#94a3b8" }}>
              {isDragging ? "Release to add files" : "Drag & drop your .zip files here"}
            </p>
            <p className="text-xs" style={{ color: "#475569" }}>
              or{" "}
              <span className="underline underline-offset-2 cursor-pointer" style={{ color: "#818cf8" }}>
                browse from your computer
              </span>
            </p>

            <div className="flex items-center gap-4 mt-6 text-xs" style={{ color: "#475569" }}>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                .zip only
              </span>
              <span style={{ color: "#1e293b" }}>·</span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Max 500 MB
              </span>
              <span style={{ color: "#1e293b" }}>·</span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Multiple files
              </span>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            multiple
            className="hidden"
            onChange={e => validateAndAdd(e.target.files)}
            disabled={isUploading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="6" stroke="#f87171" strokeWidth="1.5"/>
              <path d="M8 5v4M8 11v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="rounded-2xl p-4 mb-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </span>
              <span className="text-xs font-mono" style={{ color: "#475569" }}>{formatBytes(totalSize)}</span>
            </div>
            {files.map(file => (
              <FileCard
                key={file.name}
                file={file}
                onRemove={handleRemove}
                uploadProgress={uploadProgress[file.name]}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {files.length > 0 && !allDone && (
            <button
              onClick={() => { setFiles([]); setUploadProgress({}); setError(""); setUploadResults(null); }}
              disabled={isUploading}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b",
                cursor: isUploading ? "not-allowed" : "pointer"
              }}>
              Clear all
            </button>
          )}

          <button
            onClick={allDone ? () => { setFiles([]); setUploadProgress({}); setUploadResults(null); } : uploadToBackend}
            disabled={!files.length || isUploading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: !files.length
                ? "rgba(79,70,229,0.2)"
                : allDone
                ? "linear-gradient(135deg, #059669, #10b981)"
                : "linear-gradient(135deg, #4f46e5, #6d28d9)",
              color: !files.length ? "#4f46e5" : "white",
              cursor: !files.length || isUploading ? "not-allowed" : "pointer",
              opacity: !files.length ? 0.5 : 1,
              boxShadow: files.length && !allDone ? "0 0 24px rgba(79,70,229,0.3)" : "none"
            }}>
            {isUploading
              ? "Uploading & analyzing…"
              : allDone
              ? "✓ Upload another"
              : files.length
              ? `Upload & Analyze ${files.length} file${files.length > 1 ? "s" : ""}`
              : "Select files to upload"}
          </button>
        </div>

        {/* Analysis Results from Backend */}
        {uploadResults && (
          <div className="mt-8 rounded-2xl p-5 space-y-6"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(79,70,229,0.15)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: "#818cf8" }}>Server Analysis Complete</div>
                <div className="text-xs" style={{ color: "#64748b" }}>
                  {uploadResults.total_zips} zip{uploadResults.total_zips > 1 ? "s" : ""} processed • contents printed to backend console
                </div>
              </div>
              <button
                onClick={() => setUploadResults(null)}
                className="text-xs px-3 py-1 rounded-lg"
                style={{ color: "#64748b", background: "rgba(255,255,255,0.04)" }}>
                Hide results
              </button>
            </div>

            {uploadResults.results?.map((result, idx) => (
              <div key={idx} className="rounded-xl p-4" style={{ background: "rgba(15,15,25,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="font-medium text-sm truncate" style={{ color: "#e2e8f0" }}>{result.zip_name}</div>
                  {result.error ? (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>Error</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                      {result.files_analyzed} files analyzed • {result.skipped_files} skipped
                    </span>
                  )}
                </div>

                {result.error ? (
                  <div className="text-sm" style={{ color: "#f87171" }}>{result.error}</div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                    {result.files?.length > 0 ? (
                      result.files.map((file, fidx) => (
                        <div key={fidx} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs truncate" style={{ color: "#a5b4fc" }}>{file.path}</span>
                            <span className="text-[10px] tabular-nums" style={{ color: "#475569" }}>{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <pre className="text-[10px] leading-snug whitespace-pre-wrap font-mono p-3 rounded-md overflow-x-auto"
                            style={{ color: "#cbd5e1", background: "rgba(0,0,0,0.35)", maxHeight: "180px" }}>
                            {file.preview}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs italic" style={{ color: "#475569" }}>No readable text files found in this archive.</div>
                     )}
                   </div>
                 )}
               </div>
             ))}
            
            {/* Final total — displayed at the very end as requested */}
            <div className="pt-4 mt-3 border-t flex items-center justify-between text-xs"
              style={{ borderColor: "rgba(79,70,229,0.2)" }}>
              <span style={{ color: "#64748b" }}>Total files read &amp; printed to console</span>
              <span className="font-mono font-semibold tabular-nums" style={{ color: "#818cf8" }}>
                {uploadResults.results?.reduce((sum, r) => sum + (r.files_analyzed || 0), 0) || 0}
              </span>
            </div>
           </div>
         )}
      </div>
    </div>
  );
}
