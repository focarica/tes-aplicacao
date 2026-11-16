import { beforeEach, describe, expect, it, vi } from "vitest";

// Testes de caracterização: descrevem o comportamento observável das Server
// Actions de perfil. Só os módulos de fronteira (sessão, Cognito, S3, cache e
// diagnóstico) são simulados, para que os testes continuem válidos se a
// implementação interna das actions mudar.

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getAccessToken: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateAvatarKey: vi.fn(),
  changePassword: vi.fn(),
  assertAvatarOwnership: vi.fn((userId: string, key: string) => {
    if (!key.startsWith(`avatars/${userId}/`)) {
      throw Object.assign(new Error("FORBIDDEN"), { name: "ForbiddenError" });
    }
  }),
  avatarObject: vi.fn(),
  deleteAvatar: vi.fn(),
  revalidatePath: vi.fn(),
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
  changePassword: mocks.changePassword,
}));
vi.mock("@/lib/aws/s3", () => ({
  assertAvatarOwnership: mocks.assertAvatarOwnership,
  avatarObject: mocks.avatarObject,
  deleteAvatar: mocks.deleteAvatar,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/diagnostics", () => ({ reportAuthError: mocks.reportAuthError }));

import {
  changePasswordAction,
  setAvatarAction,
  updateProfileAction,
} from "../src/app/actions/profile";

const OLD_KEY = "avatars/user-1/antiga.png";
const NEW_KEY = "avatars/user-1/nova.png";
const USER_POOL_ERROR = "O User Pool não aceitou os campos. Verifique os atributos custom:description e custom:avatar_key.";

function profileForm(fullName: string, description: string) {
  const data = new FormData();
  data.set("fullName", fullName);
  data.set("description", description);
  return data;
}

function passwordForm(currentPassword: string, newPassword: string, confirmPassword = newPassword) {
  const data = new FormData();
  data.set("currentPassword", currentPassword);
  data.set("newPassword", newPassword);
  data.set("confirmPassword", confirmPassword);
  return data;
}

function awsError(name: string) {
  return Object.assign(new Error(name), { name });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthenticatedUser.mockResolvedValue({ userId: "user-1" });
  mocks.getAccessToken.mockResolvedValue("token-1");
  // Sempre devolve um perfil válido, quantas vezes for lido.
  mocks.getProfile.mockResolvedValue({
    id: "user-1",
    fullName: "Ana Silva",
    username: "ana",
    email: "ana@example.com",
    profileImageUrl: null,
    description: "Fotógrafa",
    createdAt: "",
    avatarKey: OLD_KEY,
  });
  mocks.updateProfile.mockResolvedValue(undefined);
  mocks.updateAvatarKey.mockResolvedValue(undefined);
  mocks.changePassword.mockResolvedValue(undefined);
  mocks.avatarObject.mockResolvedValue({ contentType: "image/png", sizeBytes: 1024 });
  mocks.deleteAvatar.mockResolvedValue(undefined);
});

describe("updateProfileAction", () => {
  it("saves the trimmed fields and refreshes the profile page", async () => {
    await expect(updateProfileAction({}, profileForm("  Ana Souza ", " Viajante ")))
      .resolves.toEqual({ message: "Perfil atualizado." });
    expect(mocks.updateProfile).toHaveBeenCalledWith("token-1", { fullName: "Ana Souza", description: "Viajante" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/perfil");
  });

  it("rejects a short name without saving", async () => {
    await expect(updateProfileAction({}, profileForm("A", "")))
      .resolves.toEqual({ error: "Informe o nome completo." });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("asks the user to sign in again without a session", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(updateProfileAction({}, profileForm("Ana Silva", "")))
      .resolves.toEqual({ error: "Sessão expirada. Entre novamente." });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("explains a User Pool attribute error", async () => {
    mocks.updateProfile.mockRejectedValue(awsError("InvalidParameterException"));

    await expect(updateProfileAction({}, profileForm("Ana Silva", "")))
      .resolves.toEqual({ error: USER_POOL_ERROR });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("setAvatarAction", () => {
  it("saves the new key, deletes the previous photo and refreshes the page", async () => {
    await expect(setAvatarAction(NEW_KEY)).resolves.toEqual({ message: "Foto atualizada." });
    expect(mocks.updateAvatarKey).toHaveBeenCalledWith("token-1", NEW_KEY);
    expect(mocks.deleteAvatar).toHaveBeenCalledTimes(1);
    expect(mocks.deleteAvatar).toHaveBeenCalledWith("user-1", OLD_KEY);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/perfil");
  });

  it("keeps the photo when the same key is sent again", async () => {
    await expect(setAvatarAction(OLD_KEY)).resolves.toEqual({ message: "Foto atualizada." });
    expect(mocks.deleteAvatar).not.toHaveBeenCalled();
  });

  it("rejects an empty key", async () => {
    await expect(setAvatarAction("")).resolves.toEqual({ error: "Imagem inválida." });
    expect(mocks.updateAvatarKey).not.toHaveBeenCalled();
  });

  it("asks the user to sign in again without a session", async () => {
    mocks.getAccessToken.mockResolvedValue(null);

    await expect(setAvatarAction(NEW_KEY)).resolves.toEqual({ error: "Sessão expirada. Entre novamente." });
    expect(mocks.updateAvatarKey).not.toHaveBeenCalled();
  });

  it("rejects a key from another user's folder", async () => {
    await expect(setAvatarAction("avatars/user-2/foto.png"))
      .resolves.toEqual({ error: "Sem permissão para alterar esta imagem." });
    expect(mocks.avatarObject).not.toHaveBeenCalled();
    expect(mocks.updateAvatarKey).not.toHaveBeenCalled();
  });

  it.each([
    ["a non-image file", { contentType: "application/pdf", sizeBytes: 10 }, "Envie uma imagem válida."],
    ["an image larger than 5 MB", { contentType: "image/jpeg", sizeBytes: 5 * 1024 * 1024 + 1 }, "Imagem muito grande (máximo 5 MB)."],
  ])("deletes the upload and rejects %s", async (_label, object, error) => {
    mocks.avatarObject.mockResolvedValue(object);

    await expect(setAvatarAction(NEW_KEY)).resolves.toEqual({ error });
    expect(mocks.deleteAvatar).toHaveBeenCalledWith("user-1", NEW_KEY);
    expect(mocks.updateAvatarKey).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("explains that the uploaded image was not found", async () => {
    mocks.avatarObject.mockRejectedValue(awsError("NotFound"));

    await expect(setAvatarAction(NEW_KEY))
      .resolves.toEqual({ error: "A imagem não foi encontrada no armazenamento. Envie novamente." });
  });

  it("deletes the upload and keeps the previous photo when saving the key fails", async () => {
    mocks.updateAvatarKey.mockRejectedValue(awsError("InvalidParameterException"));

    await expect(setAvatarAction(NEW_KEY)).resolves.toEqual({ error: USER_POOL_ERROR });
    expect(mocks.deleteAvatar).toHaveBeenCalledWith("user-1", NEW_KEY);
    expect(mocks.deleteAvatar).not.toHaveBeenCalledWith("user-1", OLD_KEY);
  });
});

describe("changePasswordAction", () => {
  it("changes the password with the session access token", async () => {
    await expect(changePasswordAction({}, passwordForm("SenhaAtual1!", "NovaSenha1!")))
      .resolves.toEqual({ message: "Senha alterada. Use a nova senha no próximo login." });
    expect(mocks.changePassword).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({ currentPassword: "SenhaAtual1!", newPassword: "NovaSenha1!" }),
    );
  });

  it("rejects a confirmation that does not match", async () => {
    await expect(changePasswordAction({}, passwordForm("SenhaAtual1!", "NovaSenha1!", "Outra1!")))
      .resolves.toEqual({ error: "As senhas não conferem." });
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it("explains a wrong current password", async () => {
    mocks.changePassword.mockRejectedValue(awsError("NotAuthorizedException"));

    await expect(changePasswordAction({}, passwordForm("Errada1!", "NovaSenha1!")))
      .resolves.toEqual({ error: "Senha atual incorreta." });
  });
});
