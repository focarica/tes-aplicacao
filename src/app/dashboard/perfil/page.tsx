import { redirect } from "next/navigation";
import { getAccessToken, getAuthenticatedUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/auth/profile";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export default async function PerfilPage() {
  const [user, accessToken] = await Promise.all([getAuthenticatedUser(), getAccessToken()]);
  if (!user || !accessToken) redirect("/login");

  let profile;
  try {
    profile = await getProfile(accessToken);
  } catch (error) {
    console.error("load profile failed", error);
    return (
      <p className="rounded-2xl border border-sand-dark bg-cream p-6 text-sm text-red-600" role="alert">
        Não foi possível carregar o perfil. Recarregue a página ou entre novamente.
      </p>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <section className="rounded-2xl border border-sand bg-cream p-5 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row">
          <AvatarUploader imageUrl={profile.profileImageUrl} name={profile.fullName} />

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-espresso">Dados do perfil</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-400">Username</dt>
                <dd className="truncate text-stone-700" title={profile.username}>{profile.username || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-400">Email</dt>
                <dd className="truncate text-stone-700" title={profile.email}>{profile.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-400">Desde</dt>
                <dd className="text-stone-700">{formatDate(profile.createdAt)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-stone-400">
              Username e email não podem ser alterados nesta versão.
            </p>
            <div className="mt-4 border-t border-sand pt-4">
              <ProfileForm fullName={profile.fullName} description={profile.description} />
            </div>
          </div>
        </div>
      </section>

      <PasswordForm />
    </div>
  );
}
