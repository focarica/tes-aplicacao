"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Uploader from "@/components/Uploader";
import FileCard from "@/components/FileCard";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import type { FileRecord } from "@/models/file.model";
import { kindOf } from "@/lib/media";
import { preloadGalleryImages } from "@/lib/images";

type GalleryTab = "all" | "image" | "video" | "other";

const TABS: { key: GalleryTab; label: string; icon: string }[] = [
  { key: "all", label: "Todos", icon: "/folder_copy_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
  { key: "image", label: "Imagens", icon: "/photo_camera_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
  { key: "video", label: "Vídeos", icon: "/videocam_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
  { key: "other", label: "Documentos", icon: "/library_books_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
];

export default function GalleryClient() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<GalleryTab>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/files", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar os arquivos.");
      const files = json.files as FileRecord[];
      await preloadGalleryImages(files);
      setFiles(files);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os arquivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: files.length,
      image: files.filter((file) => kindOf(file.mimeType) === "image").length,
      video: files.filter((file) => kindOf(file.mimeType) === "video").length,
      other: files.filter((file) => kindOf(file.mimeType) === "other").length,
    }),
    [files],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return files.filter((file) => {
      if (tab !== "all" && kindOf(file.mimeType) !== tab) return false;
      if (normalized && !file.filename.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [files, tab, query]);

  const tabNoun =
    tab === "all"
      ? "arquivos"
      : tab === "image"
        ? "imagens"
        : tab === "video"
          ? "vídeos"
          : "documentos";

  return (
    <div className="space-y-5">
      <Uploader onUploaded={load} />

      <div className="flex flex-col gap-3 rounded-2xl border border-sand bg-cream p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-1 rounded-xl bg-sand/60 p-1"
          role="tablist"
          aria-label="Filtrar por tipo de mídia"
        >
          {TABS.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === item.key
                  ? "bg-espresso text-amber-50 shadow-sm"
                  : "text-stone-500 hover:text-espresso"
              }`}
            >
              <img src={item.icon} alt="" aria-hidden="true" className={`h-4 w-4 ${tab === item.key ? "brightness-0 invert" : "brightness-0 opacity-50"}`} />
              {item.label} ({counts[item.key]})
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome…"
            aria-label="Buscar arquivos por nome"
            className="w-full rounded-xl border border-sand-dark bg-parchment py-2 pl-9 pr-8 text-sm text-espresso placeholder:text-stone-400 focus:border-espresso focus:outline-none"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            ⌕
          </span>
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              title="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-stone-400 hover:bg-sand hover:text-espresso"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingOverlay />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && files.length === 0 && (
        <p className="rounded-2xl border border-dashed border-sand-dark bg-cream p-8 text-center text-sm text-stone-500">
          Nenhum arquivo ainda — envie sua primeira imagem, vídeo ou documento acima.
        </p>
      )}
      {!loading && !error && files.length > 0 && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-sand-dark bg-cream p-8 text-center text-sm text-stone-500">
          {query.trim() ? (
            <>
              Nenhum resultado para{" "}
              <span className="font-medium text-espresso">“{query.trim()}”</span>.
              <button
                onClick={() => {
                  setQuery("");
                  setTab("all");
                }}
                className="ml-2 underline hover:text-espresso"
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>Nenhum(a) {tabNoun} ainda.</>
          )}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((file, index) => (
          <div
            key={`${file.id}-${tab}`}
            className="animate-card-in"
            style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
          >
            <FileCard file={file} onDeleted={load} />
          </div>
        ))}
      </div>
      {files.length > 0 && (
        <p className="text-xs text-stone-400">
          As URLs de visualização expiram em cerca de 1 hora e são renovadas ao recarregar.
        </p>
      )}
    </div>
  );
}
