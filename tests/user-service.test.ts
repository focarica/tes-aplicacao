import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateUserProfile, UserProfile } from "../src/models/user.model";
import type { UserRepository } from "../src/repositories/user.repository";

const s3 = vi.hoisted(() => ({
  assertAvatarOwnership: vi.fn((userId: string, key: string) => {
    if (!key.startsWith(`avatars/${userId}/`)) {
      throw Object.assign(new Error("FORBIDDEN"), { name: "ForbiddenError" });
    }
  }),
  avatarObject: vi.fn(),
  deleteAvatar: vi.fn(),
}));

vi.mock("@/lib/aws/s3", () => s3);

import { createUserService } from "../src/services/user.service";

const OLD_KEY = "avatars/user-1/antiga.png";
const NEW_KEY = "avatars/user-1/nova.png";

function storedProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    fullName: "Ana Silva",
    username: "ana",
    email: "ana@example.com",
    profileImageUrl: "https://example.com/antiga.png",
    description: "Fotógrafa",
    createdAt: "2026-01-02T03:04:05.000Z",
    avatarKey: OLD_KEY,
    ...overrides,
  };
}

/** Repositório em memória que implementa o contrato usado pelo serviço. */
function fakeRepository(initial: UserProfile | null = storedProfile()) {
  let profile = initial;
  return {
    findById: vi.fn(async (userId: string) => (profile && profile.id === userId ? { ...profile } : null)),
    update: vi.fn(async (_userId: string, input: UpdateUserProfile) => {
      profile = { ...profile!, ...input };
      return { ...profile };
    }),
    updateAvatarKey: vi.fn(async (_userId: string, key: string) => {
      profile = { ...profile!, avatarKey: key };
    }),
  } satisfies UserRepository;
}

beforeEach(() => {
  vi.clearAllMocks();
  s3.avatarObject.mockResolvedValue({ contentType: "image/png", sizeBytes: 1024 });
  s3.deleteAvatar.mockResolvedValue(undefined);
});

describe("user service: profile", () => {
  it("returns the public profile without the internal avatar key", async () => {
    const service = createUserService({ userId: "user-1", repository: fakeRepository() });

    const profile = await service.getCurrentProfile();
    expect(profile).toEqual({
      id: "user-1",
      fullName: "Ana Silva",
      username: "ana",
      email: "ana@example.com",
      profileImageUrl: "https://example.com/antiga.png",
      description: "Fotógrafa",
      createdAt: "2026-01-02T03:04:05.000Z",
    });
    expect(profile).not.toHaveProperty("avatarKey");
  });

  it("fails with ProfileNotFoundError when the profile does not exist", async () => {
    const service = createUserService({ userId: "user-1", repository: fakeRepository(null) });

    await expect(service.getCurrentProfile()).rejects.toMatchObject({ name: "ProfileNotFoundError" });
  });

  it("saves the edited fields and returns the public profile", async () => {
    const repository = fakeRepository();
    const service = createUserService({ userId: "user-1", repository });

    const profile = await service.updateCurrentProfile({ fullName: "Ana Souza", description: "Viajante" });
    expect(repository.update).toHaveBeenCalledWith("user-1", { fullName: "Ana Souza", description: "Viajante" });
    expect(profile).toMatchObject({ fullName: "Ana Souza", description: "Viajante" });
    expect(profile).not.toHaveProperty("avatarKey");
  });
});

describe("user service: avatar", () => {
  it("rejects an avatar key that belongs to another user", async () => {
    const repository = fakeRepository();
    const service = createUserService({ userId: "user-1", repository });

    await expect(service.updateCurrentAvatar("avatars/user-2/foto.png")).rejects.toMatchObject({ name: "ForbiddenError" });
    expect(s3.avatarObject).not.toHaveBeenCalled();
    expect(repository.updateAvatarKey).not.toHaveBeenCalled();
  });

  it.each([
    ["a non-image file", { contentType: "text/plain", sizeBytes: 10 }, "Envie uma imagem válida."],
    ["an empty image", { contentType: "image/png", sizeBytes: 0 }, "Envie uma imagem válida."],
    ["an image larger than 5 MB", { contentType: "image/png", sizeBytes: 5 * 1024 * 1024 + 1 }, "Imagem muito grande (máximo 5 MB)."],
  ])("deletes the upload and rejects %s", async (_label, object, message) => {
    s3.avatarObject.mockResolvedValue(object);
    const repository = fakeRepository();
    const service = createUserService({ userId: "user-1", repository });

    await expect(service.updateCurrentAvatar(NEW_KEY)).rejects.toMatchObject({ name: "AvatarValidationError", message });
    expect(s3.deleteAvatar).toHaveBeenCalledWith("user-1", NEW_KEY);
    expect(repository.updateAvatarKey).not.toHaveBeenCalled();
  });

  it("deletes the upload and keeps the error when saving the key fails", async () => {
    const repository = fakeRepository();
    repository.updateAvatarKey.mockRejectedValueOnce(Object.assign(new Error("bad"), { name: "InvalidParameterException" }));
    const service = createUserService({ userId: "user-1", repository });

    await expect(service.updateCurrentAvatar(NEW_KEY)).rejects.toMatchObject({ name: "InvalidParameterException" });
    expect(s3.deleteAvatar).toHaveBeenCalledWith("user-1", NEW_KEY);
    expect(s3.deleteAvatar).not.toHaveBeenCalledWith("user-1", OLD_KEY);
  });

  it("saves the new key, deletes the previous avatar and returns the public profile", async () => {
    const repository = fakeRepository();
    const service = createUserService({ userId: "user-1", repository });

    const profile = await service.updateCurrentAvatar(NEW_KEY);
    expect(repository.updateAvatarKey).toHaveBeenCalledWith("user-1", NEW_KEY);
    expect(s3.deleteAvatar).toHaveBeenCalledTimes(1);
    expect(s3.deleteAvatar).toHaveBeenCalledWith("user-1", OLD_KEY);
    expect(profile).not.toHaveProperty("avatarKey");
  });

  it("keeps the photo when the same key is sent again", async () => {
    const service = createUserService({ userId: "user-1", repository: fakeRepository(storedProfile({ avatarKey: NEW_KEY })) });

    await service.updateCurrentAvatar(NEW_KEY);
    expect(s3.deleteAvatar).not.toHaveBeenCalled();
  });

  it("does not fail when deleting the previous avatar fails", async () => {
    s3.deleteAvatar.mockRejectedValue(new Error("S3 indisponível"));
    const service = createUserService({ userId: "user-1", repository: fakeRepository() });

    await expect(service.updateCurrentAvatar(NEW_KEY)).resolves.toMatchObject({ id: "user-1" });
  });
});
