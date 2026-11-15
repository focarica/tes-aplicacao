import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="rounded-xl border border-sand-dark bg-cream px-3 py-1.5 text-sm text-espresso hover:bg-parchment"
        type="submit"
      >
        Sair
      </button>
    </form>
  );
}
