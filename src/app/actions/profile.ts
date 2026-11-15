"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ProfileActionState } from "@/models/profile-action.model";
import { getAccessToken, getAuthenticatedUser } from "@/lib/auth/session";
import {
  changePassword,
  getProfile,
  updateAvatarKey,
  updateProfile,
} from "@/lib/auth/profile";
import { authErrorName, userFacingError } from "@/lib/auth/errors";
import { reportAuthError } from "@/lib/auth/diagnostics";
import { MAX_AVATAR_BYTES } from "@/lib/media";
import { cognitoPasswordSchema } from "@/lib/auth/validation";
import {
  assertAvatarOwnership,
  avatarObject,
  deleteAvatar,
} from "@/lib/aws/s3";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo.").max(200),
  description: z.string().trim().max(500),
});

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

function profileError(error: unknown, operation: "profile" | "password" | "avatar") {
  const name = authErrorName(error);
  if (name === "NotAuthorizedException" && operation === "password") {
    return "Senha atual incorreta.";
  }
  if (name === "InvalidParameterException" && operation !== "password") {
    return "O User Pool não aceitou os campos. Verifique os atributos custom:description e custom:avatar_key.";
  }
  if (name === "NotFound" || name === "NoSuchKey") {
    return "A imagem não foi encontrada no armazenamento. Envie novamente.";
  }
  if (name === "S3ConfigurationError") {
    return "O armazenamento não está configurado.";
  }
  if (name === "ForbiddenError") {
    return "Sem permissão para alterar esta imagem.";
  }
  return userFacingError(error);
}

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira os dados do perfil." };
  }

  const session = await currentSession();
  if (!session) return { error: "Sessão expirada. Entre novamente." };

  try {
    await updateProfile(session.accessToken, parsed.data);
    revalidatePath("/dashboard/perfil");
    return { message: "Perfil atualizado." };
  } catch (error) {
    reportAuthError("profile-update", error);
    return { error: profileError(error, "profile") };
  }
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
    return { error: profileError(error, "password") };
  }
}

export async function setAvatarAction(key: string): Promise<ProfileActionState> {
  const session = await currentSession();
  if (!session) return { error: "Sessão expirada. Entre novamente." };
  if (typeof key !== "string" || key.length === 0) {
    return { error: "Imagem inválida." };
  }

  try {
    assertAvatarOwnership(session.user.userId, key);
    const object = await avatarObject(session.user.userId, key);
    if (!object.contentType.startsWith("image/") || object.sizeBytes <= 0) {
      await deleteAvatar(session.user.userId, key).catch(() => {});
      return { error: "Envie uma imagem válida." };
    }
    if (object.sizeBytes > MAX_AVATAR_BYTES) {
      await deleteAvatar(session.user.userId, key).catch(() => {});
      return { error: "Imagem muito grande (máximo 5 MB)." };
    }

    const current = await getProfile(session.accessToken, { includeCreatedAt: false });
    try {
      await updateAvatarKey(session.accessToken, key);
    } catch (error) {
      await deleteAvatar(session.user.userId, key).catch(() => {});
      throw error;
    }
    if (current.avatarKey && current.avatarKey !== key) {
      await deleteAvatar(session.user.userId, current.avatarKey).catch(() => {});
    }

    revalidatePath("/dashboard/perfil");
    return { message: "Foto atualizada." };
  } catch (error) {
    reportAuthError("profile-avatar", error);
    return { error: profileError(error, "avatar") };
  }
}
