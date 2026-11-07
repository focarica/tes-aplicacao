import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getAuthenticatedUser();
  if (user) redirect("/dashboard");

  return (
    <main>
      <h1>TES — Aplicação</h1>
      <p>Estrutura inicial do projeto Next.js.</p>
      <p>
        Autenticação e cadastro utilizam AWS Cognito.
      </p>
      <p><Link href="/login">Entrar</Link> · <Link href="/signup">Criar conta</Link></p>
    </main>
  );
}
