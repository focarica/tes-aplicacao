"use client";

import { usePathname } from "next/navigation";

export function SectionTitle() {
  const pathname = usePathname();
  const title = pathname?.startsWith("/dashboard/perfil") ? "Perfil" : "Galeria";

  return (
    <h1
      key={title}
      className="animate-title-in font-title text-3xl font-semibold tracking-tight text-espresso sm:text-4xl"
    >
      {title}
    </h1>
  );
}
