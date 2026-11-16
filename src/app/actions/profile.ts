"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ProfileActionState } from "@/models/profile-action.model";
import { getAccessToken, getAuthenticatedUser } from "@/lib/auth/session";
import { changePassword } from "@/lib/auth/profile";
import { authErrorName, userFacingError } from "@/lib/auth/errors";
import { reportAuthError } from "@/lib/auth/diagnostics";
import { cognitoPasswordSchema } from "@/lib/auth/validation";
import { profileController } from "@/controllers/profile.controller";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual.").max(256),
    newPassword: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha.").max(256),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

async function currentSession() {
  const [user, accessToken] = await Promise.all([getAuthenticatedUser(), getAccessToken()]);
  if (!user || !accessToken) return null;
  return { user, accessToken };
}

function passwordError(error: unknown) {
  if (authErrorName(error) === "NotAuthorizedException") {
    return "Senha atual incorreta.";
  }
  return userFacingError(error);
}

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const result = await profileController.updateProfile(Object.fromEntries(formData.entries()));
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/perfil");
  return { message: "Perfil atualizado." };
}

export async function changePasswordAction(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira as senhas informadas." };
  }

  const session = await currentSession();
  if (!session) return { error: "Sessão expirada. Entre novamente." };

  try {
    await changePassword(session.accessToken, parsed.data);
    return { message: "Senha alterada. Use a nova senha no próximo login." };
  } catch (error) {
    reportAuthError("profile-password", error);
    return { error: passwordError(error) };
  }
}

export async function setAvatarAction(key: string): Promise<ProfileActionState> {
  const result = await profileController.updateAvatar({ key });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/perfil");
  return { message: "Foto atualizada." };
}
