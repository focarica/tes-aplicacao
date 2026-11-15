import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Galeria - TES",
  description: "Galeria privada com autenticação AWS Cognito e armazenamento S3.",
  icons: { icon: "/image_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={geistMono.variable}>
      <body className="bg-parchment text-stone-800 antialiased">{children}</body>
    </html>
  );
}
