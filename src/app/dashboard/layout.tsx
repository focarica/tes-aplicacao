import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { SectionTitle } from "@/components/SectionTitle";
import { getAccessToken, getAuthenticatedUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/auth/profile";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [user, accessToken] = await Promise.all([getAuthenticatedUser(), getAccessToken()]);
  if (!user || !accessToken) redirect("/login");

  let name = "Perfil";
  let imageUrl: string | null = null;
  try {
    const profile = await getProfile(accessToken, { includeCreatedAt: false });
    name = profile.fullName || profile.username || name;
    imageUrl = profile.profileImageUrl;
  } catch (error) {
    console.error("load dashboard profile failed", error);
  }

  return (
    <main className="min-h-screen bg-parchment p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="mb-6 flex items-center justify-between gap-3">
          <SectionTitle />
          <ProfileMenu name={name} imageUrl={imageUrl} />
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-8 flex justify-end border-t border-sand pt-4">
          <SignOutButton />
        </footer>
      </div>
    </main>
  );
}
