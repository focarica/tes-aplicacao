"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cognitoAuthProvider } from "@/lib/auth/cognito";
import { clearSession, createSession } from "@/lib/auth/session";
import { signInSchema } from "@/lib/auth/validation";
import { userFacingError } from "@/lib/auth/errors";
import type { AuthActionState } from "@/models/auth-action.model";

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Informe email e senha." };
  try {
    const result = await cognitoAuthProvider.signIn(parsed.data);
    if (result.status === "challenge-required") {
      return { error: `O Cognito solicitou um desafio não habilitado nesta versão (${result.challenge}).` };
    }
    if (!result.tokens) return { error: "O provedor não retornou uma sessão válida." };
    await createSession(result.tokens);
  } catch (error) {
    return { error: userFacingError(error) };
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  const store = await cookies();
  const accessToken = store.get("tes_access_token")?.value;
  if (accessToken) {
    try {
      await cognitoAuthProvider.signOut(accessToken);
    } catch {
    }
  }
  await clearSession();
  redirect("/login");
}
