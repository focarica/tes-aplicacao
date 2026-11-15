"use client";

import { useState } from "react";
import type { FileRecord } from "@/models/file.model";
import { kindOf } from "@/lib/media";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { LoadedImage } from "@/components/LoadedImage";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

type Props = { file: FileRecord; onDeleted?: () => void };

export default function FileCard({ file, onDeleted }: Props) {
  const kind = kindOf(file.mimeType);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  async function remove() {
    if (!window.confirm(`Excluir "${file.filename}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/files?key=${encodeURIComponent(file.s3Key)}`, {
        method: "DELETE",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? "Não foi possível excluir o arquivo.");
      onDeleted?.();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Não foi possível excluir o arquivo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-sand bg-cream shadow-sm">
      <div className="aspect-video bg-sand flex items-center justify-center overflow-hidden">
        {kind === "image" && file.viewUrl ? (
          <LoadedImage
            src={file.viewUrl}
            alt={file.filename}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover"
          />
        ) : kind === "video" && file.viewUrl ? (
          <video
            src={file.viewUrl}
            controls
            preload="metadata"
            className="h-full w-full"
          />
        ) : (
          <span className="p-4 text-center text-sm text-stone-500">
            {file.filename}
            <br />
            <span className="text-xs">Sem prévia — use o link Abrir</span>
          </span>
        )}
      </div>
      <div className="p-3">
        <p
          className="truncate text-sm font-medium text-espresso"
          title={file.filename}
        >
          {file.filename}
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          {formatBytes(file.sizeBytes)} · {file.mimeType} ·{" "}
          {new Date(file.createdAt).toLocaleString("pt-BR")}
        </p>
        <div className="mt-2 flex gap-2">
          {file.viewUrl && (
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="rounded-lg bg-espresso px-3 py-1.5 text-xs text-amber-50 transition-colors hover:bg-espresso-light"
            >
              Abrir
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Excluindo…" : "Excluir"}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
      {preview && file.viewUrl && (
        <FilePreviewModal file={file} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}
