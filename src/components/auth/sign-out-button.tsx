import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button className="auth-button" type="submit">Sair</button>
    </form>
  );
}
