import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import GalleryClient from "@/components/GalleryClient";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-parchment p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand bg-cream px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-espresso">Sua galeria</h1>
            <p className="text-sm text-stone-500">Arquivos privados</p>
          </div>
          <SignOutButton />
        </header>
        <GalleryClient />
      </div>
    </main>
  );
}
