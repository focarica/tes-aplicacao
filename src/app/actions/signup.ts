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
    const invalidPassword = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return { error: invalidPassword ? "A senha deve atender a todos os requisitos indicados abaixo do campo." : "Confira nome completo, username e email." };
  }
  try {
    const result = await cognitoRegistration.signUp(parsed.data);
    if (!result.requiresConfirmation) {
      return { message: "Cadastro concluído. Você já pode entrar." };
    }
    return { message: "Cadastro iniciado. Informe o código recebido por email para confirmar a conta.", username: parsed.data.username };
  } catch (error) {
    reportAuthError("signup", error);
    return { error: userFacingError(error, "signup") };
  }
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
