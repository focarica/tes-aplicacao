"use server";

import { redirect } from "next/navigation";
import type { AuthActionState } from "@/models/auth-action.model";
import { cognitoRegistration } from "@/lib/auth/registration";
import { userFacingError } from "@/lib/auth/errors";
import { reportAuthError } from "@/lib/auth/diagnostics";
import { confirmSignUpSchema, signUpSchema } from "@/lib/auth/validation";

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Confira nome completo, username, email, descrição e senha." };
  }
  try {
    const result = await cognitoRegistration.signUp(parsed.data);
    if (!result.requiresConfirmation) {
      return { message: "Cadastro concluído. Você já pode entrar." };
    }
  } catch (error) {
    reportAuthError("signup", error);
    return { error: userFacingError(error, "signup") };
  }
  redirect(`/confirm-signup?username=${encodeURIComponent(parsed.data.username)}`);
}

export async function confirmSignUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = confirmSignUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Informe o usuário e o código recebido por email." };
  try {
    await cognitoRegistration.confirmSignUp(parsed.data);
  } catch (error) {
    reportAuthError("confirm", error);
    return { error: userFacingError(error, "confirm") };
  }
  redirect("/login?confirmed=1");
}
