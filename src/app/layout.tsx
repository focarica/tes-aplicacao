import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TES — Aplicação",
  description: "Galeria privada com autenticação AWS Cognito e armazenamento S3.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-parchment text-stone-800 antialiased">{children}</body>
    </html>
  );
}
