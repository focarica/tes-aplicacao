import "server-only";

import { z } from "zod";
import type { User } from "@/models/user.model";
import { getAccessToken, getAuthenticatedUser } from "@/lib/auth/session";
import { authErrorName, userFacingError } from "@/lib/auth/errors";
import { reportAuthError } from "@/lib/auth/diagnostics";
import { createUserService, type UserService } from "@/services/user.service";
import { createCognitoUserRepository } from "@/repositories/cognito-user.repository";

export type ControllerErrorStatus = 400 | 401 | 403 | 404 | 500;

export type ControllerResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: ControllerErrorStatus; error: string };

/** Ponto de entrada do backend de perfil, usado pelas Server Actions e pela API. */
export interface ProfileController {
  getProfile(): Promise<ControllerResult<User>>;
  updateProfile(input: unknown): Promise<ControllerResult<User>>;
  updateAvatar(input: unknown): Promise<ControllerResult<User>>;
}

type ProfileOperation = "profile-read" | "profile-update" | "profile-avatar";

const SESSION_EXPIRED = "Sessão expirada. Entre novamente.";

const profileSchema = z.object({
  fullName: z.string({ error: "Informe o nome completo." })
    .trim()
    .min(2, "Informe o nome completo.")
    .max(200, "O nome deve ter no máximo 200 caracteres."),
  description: z.string({ error: "Envie a descrição, mesmo que vazia." })
    .trim()
    .max(500, "A descrição deve ter no máximo 500 caracteres."),
}, { error: "Confira os dados do perfil." });

const avatarSchema = z.object({
  key: z.string({ error: "Imagem inválida." })
    .min(1, "Imagem inválida.")
    .max(1024, "Imagem inválida."),
}, { error: "Imagem inválida." });

function failure(status: ControllerErrorStatus, error: string): ControllerResult<never> {
  return { ok: false, status, error };
}

function invalidInput(error: z.ZodError, fallback: string): ControllerResult<never> {
  return failure(400, error.issues[0]?.message ?? fallback);
}

/** Monta o serviço do usuário logado; sem sessão verificada, devolve null. */
async function serviceForSession(): Promise<UserService | null> {
  const [user, accessToken] = await Promise.all([getAuthenticatedUser(), getAccessToken()]);
  if (!user || !accessToken) return null;
  return createUserService({
    userId: user.userId,
    repository: createCognitoUserRepository({ userId: user.userId, accessToken }),
  });
}

/** Traduz erros do Cognito, do S3 e do serviço em status HTTP e mensagem. */
function errorResult(error: unknown): ControllerResult<never> {
  switch (authErrorName(error)) {
    case "ForbiddenError":
      return failure(403, "Sem permissão para alterar esta imagem.");
    case "NotFound":
    case "NoSuchKey":
      return failure(404, "A imagem não foi encontrada no armazenamento. Envie novamente.");
    case "ProfileNotFoundError":
      return failure(404, "Perfil não encontrado. Entre novamente.");
    case "S3ConfigurationError":
      return failure(500, "O armazenamento não está configurado.");
    case "InvalidParameterException":
      return failure(500, "O User Pool não aceitou os campos. Verifique os atributos custom:description e custom:avatar_key.");
    case "NotAuthorizedException":
      return failure(401, userFacingError(error));
    default:
      return failure(500, userFacingError(error));
  }
}

async function run(
  operation: ProfileOperation,
  action: () => Promise<User>,
): Promise<ControllerResult<User>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    // Foto inválida é erro de entrada do usuário, não falha do servidor.
    if (authErrorName(error) === "AvatarValidationError" && error instanceof Error) {
      return failure(400, error.message);
    }
    reportAuthError(operation, error);
    return errorResult(error);
  }
}

export const profileController: ProfileController = {
  async getProfile() {
    const service = await serviceForSession();
    if (!service) return failure(401, SESSION_EXPIRED);
    return run("profile-read", () => service.getCurrentProfile());
  },

  async updateProfile(input) {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, "Confira os dados do perfil.");

    const service = await serviceForSession();
    if (!service) return failure(401, SESSION_EXPIRED);
    return run("profile-update", () => service.updateCurrentProfile(parsed.data));
  },

  async updateAvatar(input) {
    const service = await serviceForSession();
    if (!service) return failure(401, SESSION_EXPIRED);

    const parsed = avatarSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, "Imagem inválida.");
    return run("profile-avatar", () => service.updateCurrentAvatar(parsed.data.key));
  },
};
