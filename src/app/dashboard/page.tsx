import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Autenticado. Identificador Cognito: {user.userId}</p>
      <SignOutButton />
    </main>
  );
}
