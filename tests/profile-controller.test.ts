import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "../src/models/user.model";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getAccessToken: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateAvatarKey: vi.fn(),
  assertAvatarOwnership: vi.fn((userId: string, key: string) => {
    if (!key.startsWith(`avatars/${userId}/`)) {
      throw Object.assign(new Error("FORBIDDEN"), { name: "ForbiddenError" });
    }
  }),
  avatarObject: vi.fn(),
  deleteAvatar: vi.fn(),
  reportAuthError: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  getAccessToken: mocks.getAccessToken,
}));
vi.mock("@/lib/auth/profile", () => ({
  getProfile: mocks.getProfile,
  updateProfile: mocks.updateProfile,
  updateAvatarKey: mocks.updateAvatarKey,
}));
vi.mock("@/lib/aws/s3", () => ({
  assertAvatarOwnership: mocks.assertAvatarOwnership,
  avatarObject: mocks.avatarObject,
  deleteAvatar: mocks.deleteAvatar,
}));
vi.mock("@/lib/auth/diagnostics", () => ({ reportAuthError: mocks.reportAuthError }));

import { profileController } from "../src/controllers/profile.controller";

const NEW_KEY = "avatars/user-1/nova.png";

const storedProfile: UserProfile = {
  id: "user-1",
  fullName: "Ana Silva",
  username: "ana",
  email: "ana@example.com",
  profileImageUrl: null,
  description: "Fotógrafa",
  createdAt: "2026-01-02T03:04:05.000Z",
  avatarKey: null,
};

function awsError(name: string) {
  return Object.assign(new Error(name), { name });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthenticatedUser.mockResolvedValue({ userId: "user-1" });
  mocks.getAccessToken.mockResolvedValue("token-1");
  mocks.getProfile.mockResolvedValue(storedProfile);
  mocks.updateProfile.mockResolvedValue(undefined);
  mocks.updateAvatarKey.mockResolvedValue(undefined);
  mocks.avatarObject.mockResolvedValue({ contentType: "image/png", sizeBytes: 1024 });
  mocks.deleteAvatar.mockResolvedValue(undefined);
});

describe("profile controller: session", () => {
  it.each([
    ["no verified user", () => mocks.getAuthenticatedUser.mockResolvedValue(null)],
    ["no access token", () => mocks.getAccessToken.mockResolvedValue(null)],
  ])("answers 401 when there is %s", async (_label, arrange) => {
    arrange();
    await expect(profileController.getProfile()).resolves.toEqual({
      ok: false,
      status: 401,
      error: "Sessão expirada. Entre novamente.",
    });
    expect(mocks.getProfile).not.toHaveBeenCalled();
  });

  it("returns the public profile of the session user", async () => {
    const result = await profileController.getProfile();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ id: "user-1", fullName: "Ana Silva" });
      expect(result.data).not.toHaveProperty("avatarKey");
    }
    expect(mocks.getProfile).toHaveBeenCalledWith("token-1");
  });
});

describe("profile controller: profile update", () => {
  it.each([
    ["a short name", { fullName: "A", description: "" }, "Informe o nome completo."],
    ["a name over 200 characters", { fullName: "a".repeat(201), description: "" }, "O nome deve ter no máximo 200 caracteres."],
    ["a description over 500 characters", { fullName: "Ana Silva", description: "a".repeat(501) }, "A descrição deve ter no máximo 500 caracteres."],
    ["a missing description", { fullName: "Ana Silva" }, "Envie a descrição, mesmo que vazia."],
    ["a name with the wrong type", { fullName: 10, description: "" }, "Informe o nome completo."],
    ["a null input", null, "Confira os dados do perfil."],
  ])("answers 400 in Portuguese for %s", async (_label, input, message) => {
    await expect(profileController.updateProfile(input)).resolves.toEqual({ ok: false, status: 400, error: message });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("validates the input before checking the session", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);
    await expect(profileController.updateProfile({ fullName: "A", description: "" }))
      .resolves.toMatchObject({ status: 400, error: "Informe o nome completo." });
  });

  it("saves trimmed fields and returns the profile read again", async () => {
    mocks.getProfile.mockResolvedValue({ ...storedProfile, fullName: "Ana Souza", description: "Viajante" });

    const result = await profileController.updateProfile({ fullName: "  Ana Souza ", description: " Viajante ", extra: "x" });
    expect(mocks.updateProfile).toHaveBeenCalledWith("token-1", { fullName: "Ana Souza", description: "Viajante" });
    expect(result).toMatchObject({ ok: true, data: { fullName: "Ana Souza", description: "Viajante" } });
  });
});

describe("profile controller: avatar update", () => {
  it("checks the session before validating the key", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);
    await expect(profileController.updateAvatar({ key: "" }))
      .resolves.toEqual({ ok: false, status: 401, error: "Sessão expirada. Entre novamente." });
  });

  it.each([
    ["an empty key", { key: "" }],
    ["a key with the wrong type", { key: 10 }],
    ["a null input", null],
  ])("answers 400 for %s", async (_label, input) => {
    await expect(profileController.updateAvatar(input)).resolves.toEqual({ ok: false, status: 400, error: "Imagem inválida." });
  });

  it("answers 400 without reporting a server error for an invalid image", async () => {
    mocks.avatarObject.mockResolvedValue({ contentType: "text/plain", sizeBytes: 10 });

    await expect(profileController.updateAvatar({ key: NEW_KEY }))
      .resolves.toEqual({ ok: false, status: 400, error: "Envie uma imagem válida." });
    expect(mocks.reportAuthError).not.toHaveBeenCalled();
  });

  it("saves the avatar key of the session user", async () => {
    const result = await profileController.updateAvatar({ key: NEW_KEY });
    expect(result.ok).toBe(true);
    expect(mocks.updateAvatarKey).toHaveBeenCalledWith("token-1", NEW_KEY);
  });
});

describe("profile controller: error translation", () => {
  it.each([
    ["ForbiddenError", 403, "Sem permissão para alterar esta imagem."],
    ["NotFound", 404, "A imagem não foi encontrada no armazenamento. Envie novamente."],
    ["NoSuchKey", 404, "A imagem não foi encontrada no armazenamento. Envie novamente."],
    ["S3ConfigurationError", 500, "O armazenamento não está configurado."],
  ])("maps %s from the avatar storage", async (name, status, error) => {
    mocks.avatarObject.mockRejectedValue(awsError(name));

    await expect(profileController.updateAvatar({ key: NEW_KEY })).resolves.toEqual({ ok: false, status, error });
    expect(mocks.reportAuthError).toHaveBeenCalledWith("profile-avatar", expect.objectContaining({ name }));
  });

  it("maps a key outside the user's folder to 403", async () => {
    await expect(profileController.updateAvatar({ key: "avatars/user-2/foto.png" }))
      .resolves.toEqual({ ok: false, status: 403, error: "Sem permissão para alterar esta imagem." });
  });

  it.each([
    ["InvalidParameterException", 500, "O User Pool não aceitou os campos. Verifique os atributos custom:description e custom:avatar_key."],
    ["NotAuthorizedException", 401, "Email ou senha inválidos."],
    ["InternalErrorException", 500, "O serviço de autenticação está temporariamente indisponível. Tente novamente em alguns minutos."],
    ["UnexpectedError", 500, "Não foi possível concluir a operação. Tente novamente. Se persistir, consulte o diagnóstico no servidor."],
  ])("maps %s from Cognito", async (name, status, error) => {
    mocks.updateProfile.mockRejectedValue(awsError(name));

    await expect(profileController.updateProfile({ fullName: "Ana Silva", description: "" }))
      .resolves.toEqual({ ok: false, status, error });
    expect(mocks.reportAuthError).toHaveBeenCalledWith("profile-update", expect.objectContaining({ name }));
  });

  it("maps a missing profile to 404", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(profileController.getProfile())
      .resolves.toEqual({ ok: false, status: 404, error: "Perfil não encontrado. Entre novamente." });
    expect(mocks.reportAuthError).toHaveBeenCalledWith("profile-read", expect.objectContaining({ name: "ProfileNotFoundError" }));
  });
});
