"use client";

import { useMemo, useRef, useState } from "react";
import { MAX_IMAGE_BYTES, MAX_OTHER_BYTES, MAX_VIDEO_BYTES } from "@/lib/media";

type Props = { onUploaded: () => void };

type UploadStatus = "uploading" | "done" | "error";
type UploadKind = "image" | "video" | "other";
type UploadTab = "all" | "image" | "video" | "other";

type UploadItem = {
  id: string;
  name: string;
  kind: UploadKind;
  pct: number;
  status: UploadStatus;
  error?: string;
};

function kindOfFile(file: File): UploadKind {
  const type = file.type || "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return "other";
}

const TABS: { key: UploadTab; label: string; icon: string }[] = [
  { key: "all", label: "Todos", icon: "/folder_copy_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
  { key: "image", label: "Imagens", icon: "/photo_camera_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
  { key: "video", label: "Vídeos", icon: "/videocam_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
  { key: "other", label: "Documentos", icon: "/library_books_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
];

export default function Uploader({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<UploadTab>("all");

  function patchItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadOne(item: UploadItem, file: File) {
    const contentType = file.type || "application/octet-stream";
    const presign = await fetch("/api/s3/presign-put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType, size: file.size }),
    });
    const presignJson = await presign.json();
    if (!presign.ok) throw new Error(presignJson.error ?? "Falha ao preparar o upload.");
    const { putUrl } = presignJson as { putUrl: string };

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", putUrl);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          patchItem(item.id, { pct: Math.round((event.loaded / event.total) * 100) });
        }
      };
      xhr.onload = () =>
        xhr.status < 300
          ? resolve()
          : reject(new Error(`Envio ao S3 falhou (HTTP ${xhr.status}).`));
      xhr.onerror = () =>
        reject(
          new Error(
            "Falha de rede ao enviar ao S3. Verifique o CORS do bucket e as variáveis AWS_REGION/S3_BUCKET.",
          ),
        );
      xhr.send(file);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    const fresh: UploadItem[] = picked.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      kind: kindOfFile(file),
      pct: 1,
      status: "uploading" as UploadStatus,
    }));
    setItems((prev) => [...fresh, ...prev]);
    setBusy(true);
    try {
      for (let index = 0; index < picked.length; index++) {
        try {
          await uploadOne(fresh[index], picked[index]);
          patchItem(fresh[index].id, { pct: 100, status: "done" });
        } catch (error) {
          patchItem(fresh[index].id, {
            status: "error",
            error: error instanceof Error ? error.message : "Falha no upload.",
          });
        }
      }
      onUploaded();
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  function clearItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearFinished() {
    setItems((prev) => prev.filter((item) => item.status === "uploading"));
  }

  const counts = useMemo(
    () => ({
      all: items.length,
      image: items.filter((item) => item.kind === "image").length,
      video: items.filter((item) => item.kind === "video").length,
      other: items.filter((item) => item.kind === "other").length,
    }),
    [items],
  );

  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.kind === tab)),
    [items, tab],
  );

  const finishedCount = items.filter((item) => item.status !== "uploading").length;

  return (
    <div className="rounded-2xl border border-dashed border-sand-dark bg-cream p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.zip,.txt,.doc,.docx"
          disabled={busy}
          onChange={(event) => handleFiles(event.target.files)}
          className="sr-only"
          aria-label="Selecionar arquivos para upload"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-espresso px-4 py-2 text-sm font-medium text-amber-50 transition-colors hover:bg-espresso-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          Fazer upload de arquivos
        </button>
        <span className="text-xs text-stone-500">
          Imagens ≤{Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB · Vídeos ≤
          {Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB · Documentos ≤
          {Math.round(MAX_OTHER_BYTES / 1024 / 1024)} MB
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-4 rounded-xl border border-sand bg-parchment/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg bg-sand/60 p-1" role="tablist" aria-label="Filtrar envios">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  role="tab"
                  aria-selected={tab === item.key}
                  onClick={() => setTab(item.key)}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tab === item.key
                      ? "bg-cream text-espresso shadow-sm"
                      : "text-stone-500 hover:text-espresso"
                  }`}
                >
                  <img src={item.icon} alt="" aria-hidden="true" className={`h-3.5 w-3.5 ${tab === item.key ? "brightness-0 opacity-80" : "brightness-0 opacity-50"}`} />
                  {item.label} ({counts[item.key]})
                </button>
              ))}
            </div>
            <button
              onClick={clearFinished}
              disabled={finishedCount === 0}
              className="rounded-lg border border-sand-dark bg-cream px-2.5 py-1 text-xs text-stone-600 hover:bg-sand disabled:opacity-40"
            >
              Limpar concluídos ({finishedCount})
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {visible.length === 0 && (
              <p className="py-2 text-center text-xs text-stone-400">
                Nenhum envio nesta categoria.
              </p>
            )}
            {visible.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-sand bg-cream px-3 py-2 text-xs text-stone-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.kind === "image"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.kind === "video"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {item.kind === "other" ? "doc" : item.kind}
                    </span>
                    <span className="truncate font-medium" title={item.name}>
                      {item.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.status === "uploading" ? (
                      <span>{item.pct}%</span>
                    ) : item.status === "done" ? (
                      <span className="font-medium text-emerald-700">Concluído ✓</span>
                    ) : (
                      <span className="font-medium text-red-600">Falhou</span>
                    )}
                    <button
                      onClick={() => clearItem(item.id)}
                      disabled={item.status === "uploading"}
                      aria-label={`Limpar envio de ${item.name}`}
                      className="rounded px-1.5 py-0.5 text-stone-400 hover:bg-sand hover:text-espresso disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-sand">
                  <div
                    className={`h-full transition-all ${
                      item.status === "error"
                        ? "bg-red-400"
                        : item.status === "done"
                          ? "bg-emerald-500"
                          : "bg-latte"
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                {item.status === "error" && item.error && (
                  <p className="mt-1 text-[11px] text-red-600">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
