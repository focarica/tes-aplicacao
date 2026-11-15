"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
};

/** Revela a imagem só depois de carregada, evitando o desenho progressivo. */
export function LoadedImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  loading = "lazy",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Imagem em cache pode ter terminado antes da hidratação.
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <span className={`relative flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
      />
    </span>
  );
}
