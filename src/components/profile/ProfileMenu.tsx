"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoadedImage } from "@/components/LoadedImage";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function ProfileMenu({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-2xl border border-sand bg-cream px-3 py-2 text-left shadow-sm transition-colors hover:bg-parchment"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sand text-sm font-semibold text-espresso">
          {imageUrl ? (
            <LoadedImage
              src={imageUrl}
              alt=""
              className="h-full w-full"
              imgClassName="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            initials(name)
          )}
        </span>
        <span className="block max-w-[12rem] truncate text-sm font-medium text-espresso">{name}</span>
        <span
          aria-hidden="true"
          className={`text-xs text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Menu do perfil"
          className="absolute right-0 top-full z-30 mt-2 w-48 animate-pop overflow-hidden rounded-xl border border-sand bg-cream p-1 shadow-xl"
        >
          <Link
            role="menuitem"
            href="/dashboard/perfil"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-espresso transition-colors hover:bg-parchment"
          >
            Editar perfil
          </Link>
          <Link
            role="menuitem"
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-espresso transition-colors hover:bg-parchment"
          >
            Galeria
          </Link>
        </div>
      )}
    </div>
  );
}
