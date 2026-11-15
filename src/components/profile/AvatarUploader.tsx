"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_AVATAR_BYTES } from "@/lib/media";
import { setAvatarAction } from "@/app/actions/profile";
import { LoadedImage } from "@/components/LoadedImage";

type Props = { imageUrl: string | null; name: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function BrushIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-7 w-7"
    >
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.38 1.38 9.5 1.5 9.5-2 0-1.67-1.34-3.04-3-3.04z" />
    </svg>
  );
}

export function AvatarUploader({ imageUrl, name }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Imagem muito grande (máximo 5 MB).");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    setPct(1);
    try {
      const presign = await fetch("/api/s3/presign-put", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          scope: "avatar",
        }),
      });
      const json = await presign.json().catch(() => ({}));
      if (!presign.ok) throw new Error(json.error ?? "Falha ao preparar o upload.");
      const { putUrl, key } = json as { putUrl: string; key: string };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", putUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setPct(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Envio ao S3 falhou (HTTP ${xhr.status}).`)));
        xhr.onerror = () => reject(new Error("Falha de rede ao enviar a imagem."));
        xhr.send(file);
      });

      const result = await setAvatarAction(key);
      if (result.error) throw new Error(result.error);
      setMessage(result.message ?? "Foto atualizada.");
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 sm:w-40">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className="sr-only"
        aria-label="Enviar nova foto de perfil"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Editar foto de perfil"
        className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sand text-2xl font-semibold text-espresso outline-none focus-visible:ring-2 focus-visible:ring-latte/60 disabled:cursor-wait"
      >
        {imageUrl ? (
          <LoadedImage
            src={imageUrl}
            alt={`Foto de ${name}`}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          initials(name)
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-black/45 text-amber-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <BrushIcon />
        </span>
      </button>

      <p className="text-center text-xs text-stone-500">Clique na foto para editar</p>
      <p className="text-center text-xs text-stone-400">JPEG, PNG, WebP ou GIF · até 5 MB</p>
      {busy && (
        <div className="h-1.5 w-full max-w-40 overflow-hidden rounded bg-sand">
          <div className="h-full bg-latte transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {error && <p className="text-center text-xs text-red-600" role="alert">{error}</p>}
      {message && <p className="text-center text-xs text-emerald-700" role="status">{message}</p>}
    </div>
  );
}
