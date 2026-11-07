import Link from "next/link";

export default function HomePage() {
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
