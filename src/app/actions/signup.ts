"use server";

import { redirect } from "next/navigation";
import type { AuthActionState } from "@/models/auth-action.model";
import { cognitoRegistration } from "@/lib/auth/registration";
import { userFacingError } from "@/lib/auth/errors";
import { confirmSignUpSchema, signUpSchema } from "@/lib/auth/validation";

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Preencha os campos corretamente (senha com ao menos 8 caracteres)." };
  try {
    const result = await cognitoRegistration.signUp(parsed.data);
    if (!result.requiresConfirmation) {
      return { message: "Cadastro concluído. Você já pode entrar." };
    }
    return { message: "Cadastro iniciado. Informe o código recebido por email para confirmar a conta.", username: parsed.data.username };
  } catch (error) {
    return { error: userFacingError(error) };
  }
}

export async function confirmSignUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = confirmSignUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Informe o usuário e o código recebido por email." };
  try {
    await cognitoRegistration.confirmSignUp(parsed.data);
  } catch (error) {
    return { error: userFacingError(error) };
  }
  redirect("/login?confirmed=1");
}
