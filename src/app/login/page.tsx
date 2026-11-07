import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmed?: string }> }) {
  const { confirmed } = await searchParams;
  return (
    <main className="auth-card">
      <h1>Entrar</h1>
      <p>Acesse sua conta.</p>
      {confirmed === "1" && <p role="status">Conta confirmada. Você já pode entrar.</p>}
      <AuthForm
        action={signInAction}
        submitLabel="Entrar"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Senha", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p><Link href="/signup">Criar nova conta</Link></p>
    </main>
  );
}
