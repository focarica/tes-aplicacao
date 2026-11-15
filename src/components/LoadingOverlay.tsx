"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Overlay de tela cheia, no body, para não ficar preso ao container de origem. */
export function LoadingOverlay() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Carregando"
      className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-black/60 backdrop-blur-[1px]"
    >
      <div className="h-12 w-12 animate-spin border-4 border-cream/30 border-t-cream" />
      <span className="sr-only">Carregando…</span>
    </div>,
    document.body,
  );
}
