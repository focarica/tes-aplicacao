"use client";

import { useEffect, useRef, useState } from "react";
import type { FileRecord } from "@/models/file.model";
import { kindOf } from "@/lib/media";
import { LoadedImage } from "@/components/LoadedImage";

const CLOSE_MS = 160;

export function FilePreviewModal({ file, onClose }: { file: FileRecord; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const kind = kindOf(file.mimeType);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  function requestClose() {
    setClosing(true);
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      aria-labelledby="preview-title"
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-stone-800"
    >
      <div
        onClick={requestClose}
        className={`flex h-full w-full items-center justify-center bg-black/70 p-4 ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          role="document"
          className={`flex max-h-[90vh] w-[min(64rem,100%)] flex-col overflow-hidden rounded-2xl border border-sand bg-cream shadow-2xl ${
            closing ? "animate-modal-out" : "animate-modal-in"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-sand px-4 py-3">
            <h2 id="preview-title" className="truncate text-sm font-medium text-espresso" title={file.filename}>
              {file.filename}
            </h2>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Fechar prévia"
              className="rounded-lg px-2 py-1 text-stone-500 transition-colors hover:bg-sand hover:text-espresso"
            >
              ✕
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-stone-900 p-3">
            {kind === "image" && file.viewUrl ? (
              <LoadedImage
                src={file.viewUrl}
                alt={file.filename}
                className="h-[60vh] w-full"
                imgClassName="max-h-[60vh] max-w-full object-contain"
                loading="eager"
              />
            ) : kind === "video" ? (
              <video
                src={file.viewUrl}
                controls
                autoPlay
                preload="metadata"
                className="max-h-[66vh] max-w-full"
              />
            ) : (
              <p className="p-10 text-center text-sm text-stone-300">
                Prévia indisponível para este tipo de arquivo.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-sand px-4 py-3">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-sand-dark bg-cream px-3 py-1.5 text-sm text-espresso transition-colors hover:bg-parchment"
            >
              Fechar
            </button>
            {file.viewUrl && (
              <a
                href={file.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-espresso px-3 py-1.5 text-sm text-amber-50 transition-colors hover:bg-espresso-light"
              >
                Abrir em nova aba
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
