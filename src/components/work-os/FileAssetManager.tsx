"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface FileAssetItem {
  id: string;
  uploaderId: string;
  uploaderName: string;
  projectId?: string | null;
  deliverableId?: string | null;
  taskId?: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  storageKey: string;
  storageUrl: string;
  version: number;
  visibility: "INTERNAL" | "CLIENT_VISIBLE";
  virusScanStatus: "CLEAN" | "SCANNING" | "FLAGGED";
  signedDownloadUrl?: string;
  signedPreviewUrl?: string;
  createdAt: string;
}

interface FileAssetManagerProps {
  projectId?: string;
  deliverableId?: string;
  taskId?: string;
  deliverables?: Array<{ id: string; title: string }>;
  canUpload?: boolean;
  canManageVisibility?: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string, name: string) {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("zip") || mime.includes("tar") || name.endsWith(".zip")) return "📦";
  return "📁";
}

export function FileAssetManager({
  projectId,
  deliverableId,
  taskId,
  deliverables = [],
  canUpload = true,
  canManageVisibility = true,
}: FileAssetManagerProps) {
  const [files, setFiles] = useState<FileAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload modal / form state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetDeliverableId, setTargetDeliverableId] = useState<string>(deliverableId || "");
  const [uploadVisibility, setUploadVisibility] = useState<"INTERNAL" | "CLIENT_VISIBLE">("INTERNAL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state
  const [previewingFile, setPreviewingFile] = useState<FileAssetItem | null>(null);

  // Visibility toggle confirmation modal
  const [toggleConfirmFile, setToggleConfirmFile] = useState<FileAssetItem | null>(null);
  const [targetVisibility, setTargetVisibility] = useState<"INTERNAL" | "CLIENT_VISIBLE">("CLIENT_VISIBLE");

  const fetchFiles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (deliverableId) params.set("deliverableId", deliverableId);
      if (taskId) params.set("taskId", taskId);

      const res = await fetch(`/api/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, deliverableId, taskId]);

  useEffect(() => {
    let active = true;

    async function load() {
      await fetchFiles();
    }
    load();

    const interval = setInterval(() => {
      if (active) fetchFiles();
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 50 * 1024 * 1024) {
      setUploadError("File exceeds 50MB limit.");
      return;
    }

    setSelectedFile(f);
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (projectId) formData.append("projectId", projectId);
      if (targetDeliverableId) formData.append("deliverableId", targetDeliverableId);
      if (taskId) formData.append("taskId", taskId);
      formData.append("visibility", uploadVisibility);

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      await fetchFiles();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const executeVisibilityChange = async () => {
    if (!toggleConfirmFile) return;

    try {
      const res = await fetch(`/api/files/${toggleConfirmFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: targetVisibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update visibility");
      }

      setToggleConfirmFile(null);
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || "Failed to change visibility");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Project Deliverables & File Assets</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deliverable versions, preview images, video cuts, and secure client-visible exports.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <span>+</span> Upload Asset
          </button>
        )}
      </div>

      {/* File List */}
      {loading && files.length === 0 ? (
        <div className="space-y-2">
          <div className="h-16 bg-zinc-900/60 rounded-xl animate-pulse" />
          <div className="h-16 bg-zinc-900/60 rounded-xl animate-pulse" />
        </div>
      ) : files.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
          <div className="text-2xl">📁</div>
          <div className="text-xs font-semibold text-white">No files attached yet</div>
          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
            Upload images, video drafts, documents or design packages to version-track deliverables.
          </p>
          {canUpload && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg"
            >
              Upload First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {files.map((file) => {
            const isClientVisible = file.visibility === "CLIENT_VISIBLE";
            const icon = getFileIcon(file.fileType, file.fileName);
            const isPreviewable =
              file.fileType.startsWith("image/") ||
              file.fileType.startsWith("video/") ||
              file.fileType.includes("pdf");

            return (
              <div
                key={file.id}
                className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                {/* File info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lg flex-shrink-0">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate max-w-xs md:max-w-md">
                        {file.fileName}
                      </span>
                      {/* Version Badge */}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/50">
                        v{file.version}
                      </span>
                      {/* Virus scan status */}
                      {file.virusScanStatus === "FLAGGED" && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/50">
                          🚨 FLAGGED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>·</span>
                      <span>Uploaded by {file.uploaderName}</span>
                      <span>·</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Visibility Badge & Explicit Toggle */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isClientVisible
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700/60"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isClientVisible ? "CLIENT VISIBLE" : "INTERNAL"}
                    </span>

                    {canManageVisibility && (
                      <button
                        type="button"
                        onClick={() => {
                          setToggleConfirmFile(file);
                          setTargetVisibility(isClientVisible ? "INTERNAL" : "CLIENT_VISIBLE");
                        }}
                        className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 transition-colors"
                        title="Change Visibility"
                      >
                        {isClientVisible ? "Make Internal" : "Share to Client"}
                      </button>
                    )}
                  </div>

                  {/* Preview Button */}
                  {isPreviewable && (
                    <button
                      onClick={() => setPreviewingFile(file)}
                      className="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition-colors"
                    >
                      Preview
                    </button>
                  )}

                  {/* Signed Download Button */}
                  <a
                    href={file.signedDownloadUrl || `/api/files/${file.id}/download`}
                    download={file.fileName}
                    className="px-2.5 py-1 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-sky-400 hover:text-sky-300 border border-zinc-800 rounded-lg transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
       * PREVIEW MODAL (Image, Video, PDF)
       * ==================================================================== */}
      {previewingFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate max-w-md">
                  {previewingFile.fileName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/50">
                  v{previewingFile.version}
                </span>
              </div>
              <button
                onClick={() => setPreviewingFile(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50 min-h-[400px]">
              {previewingFile.fileType.startsWith("image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewingFile.signedPreviewUrl || `/api/files/${previewingFile.id}/download?preview=true`}
                  alt={previewingFile.fileName}
                  className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-lg"
                />
              ) : previewingFile.fileType.startsWith("video/") ? (
                <video
                  controls
                  autoPlay
                  src={previewingFile.signedPreviewUrl || `/api/files/${previewingFile.id}/download?preview=true`}
                  className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                />
              ) : previewingFile.fileType.includes("pdf") ? (
                <iframe
                  src={previewingFile.signedPreviewUrl || `/api/files/${previewingFile.id}/download?preview=true`}
                  title={previewingFile.fileName}
                  className="w-full h-[70vh] rounded-lg border border-zinc-800"
                />
              ) : (
                <div className="text-zinc-400 text-xs text-center">
                  Preview not available for this format. Please download the file.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
              <span>{formatBytes(previewingFile.fileSize)}</span>
              <a
                href={previewingFile.signedDownloadUrl || `/api/files/${previewingFile.id}/download`}
                download={previewingFile.fileName}
                className="px-3 py-1.5 font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg"
              >
                Download File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * EXPLICIT VISIBILITY TOGGLE CONFIRMATION MODAL
       * ==================================================================== */}
      {toggleConfirmFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">
              {targetVisibility === "CLIENT_VISIBLE"
                ? "Publish File to Client Portal?"
                : "Restrict File to Internal Team?"}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {targetVisibility === "CLIENT_VISIBLE" ? (
                <>
                  Making <strong>{toggleConfirmFile.fileName}</strong> client visible means external clients with portal credentials can immediately preview and download it.
                </>
              ) : (
                <>
                  Changing <strong>{toggleConfirmFile.fileName}</strong> to internal will immediately hide it from all client portal views.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setToggleConfirmFile(null)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeVisibilityChange}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-zinc-950 ${
                  targetVisibility === "CLIENT_VISIBLE"
                    ? "bg-emerald-500 hover:bg-emerald-400"
                    : "bg-amber-500 hover:bg-amber-400"
                }`}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * UPLOAD ASSET MODAL
       * ==================================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Upload Deliverable Asset</h3>
                <p className="text-xs text-zinc-400">
                  Max 50MB. Images, video drafts, documents or zip archives.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-750 hover:border-zinc-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="text-emerald-400 font-semibold text-xs">
                      ✓ {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {formatBytes(selectedFile.size)} · {selectedFile.type || "file"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xl">📤</div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Click or drag file to upload
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      PNG, JPG, MP4, MOV, PDF, ZIP up to 50MB
                    </div>
                  </div>
                )}
              </div>

              {/* Deliverable link (if multiple deliverables available) */}
              {deliverables.length > 0 && !deliverableId && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Associate with Deliverable (Optional):
                  </label>
                  <select
                    value={targetDeliverableId}
                    onChange={(e) => setTargetDeliverableId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                  >
                    <option value="">General Project Asset</option>
                    {deliverables.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Visibility Select */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Default Visibility:
                </label>
                <select
                  value={uploadVisibility}
                  onChange={(e) => setUploadVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                >
                  <option value="INTERNAL">INTERNAL (Visible to team only)</option>
                  <option value="CLIENT_VISIBLE">CLIENT_VISIBLE (Publish to client portal)</option>
                </select>
              </div>

              {uploadError && <div className="text-xs text-rose-400">{uploadError}</div>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-transform active:scale-95 disabled:opacity-50"
                >
                  {uploading ? "Uploading & Scanning..." : "Upload Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
