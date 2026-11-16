import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "../src/models/user.model";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateAvatarKey: vi.fn(),
}));

vi.mock("@/lib/auth/profile", () => ({
  getProfile: mocks.getProfile,
  updateProfile: mocks.updateProfile,
  updateAvatarKey: mocks.updateAvatarKey,
}));

import { createCognitoUserRepository } from "../src/repositories/cognito-user.repository";

const session = { userId: "user-1", accessToken: "token-1" };

const profile: UserProfile = {
  id: "user-1",
  fullName: "Ana Silva",
  username: "ana",
  email: "ana@example.com",
  profileImageUrl: null,
  description: "Fotógrafa",
  createdAt: "2026-01-02T03:04:05.000Z",
  avatarKey: "avatars/user-1/foto.png",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getProfile.mockResolvedValue(profile);
  mocks.updateProfile.mockResolvedValue(undefined);
  mocks.updateAvatarKey.mockResolvedValue(undefined);
});

describe("Cognito user repository", () => {
  it("reads the session user's profile with the session access token", async () => {
    const repository = createCognitoUserRepository(session);

    await expect(repository.findById("user-1")).resolves.toEqual(profile);
    expect(mocks.getProfile).toHaveBeenCalledWith("token-1");
  });

  it("returns null for another user without calling Cognito", async () => {
    const repository = createCognitoUserRepository(session);

    await expect(repository.findById("user-2")).resolves.toBeNull();
    expect(mocks.getProfile).not.toHaveBeenCalled();
  });

  it("saves the profile and returns the profile read again from Cognito", async () => {
    const saved = { ...profile, fullName: "Ana Souza", description: "" };
    mocks.getProfile.mockResolvedValue(saved);
    const repository = createCognitoUserRepository(session);

    await expect(repository.update("user-1", { fullName: "Ana Souza", description: "" })).resolves.toEqual(saved);
    expect(mocks.updateProfile).toHaveBeenCalledWith("token-1", { fullName: "Ana Souza", description: "" });
    expect(mocks.updateProfile.mock.invocationCallOrder[0]).toBeLessThan(mocks.getProfile.mock.invocationCallOrder[0]);
  });

  it("saves the avatar key with the session access token", async () => {
    const repository = createCognitoUserRepository(session);

    await repository.updateAvatarKey("user-1", "avatars/user-1/nova.png");
    expect(mocks.updateAvatarKey).toHaveBeenCalledWith("token-1", "avatars/user-1/nova.png");
  });

  it("rejects writes to another user's profile", async () => {
    const repository = createCognitoUserRepository(session);

    await expect(repository.update("user-2", { fullName: "Outra Pessoa", description: "" }))
      .rejects.toMatchObject({ name: "ForbiddenError" });
    await expect(repository.updateAvatarKey("user-2", "avatars/user-2/foto.png"))
      .rejects.toMatchObject({ name: "ForbiddenError" });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(mocks.updateAvatarKey).not.toHaveBeenCalled();
  });
});
