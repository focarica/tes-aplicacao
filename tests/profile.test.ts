import { describe, expect, it } from "vitest";
import { mapProfile } from "../src/lib/auth/profile";

describe("Cognito profile mapping", () => {
  it("maps profile and avatar attributes", () => {
    const profile = mapProfile({
      username: "jdoe",
      createdAt: new Date("2026-01-02T03:04:05Z"),
      attributes: [
        { Name: "sub", Value: "user-123" },
        { Name: "name", Value: "João Silva" },
        { Name: "cognito:username", Value: "jdoe" },
        { Name: "email", Value: "joao@example.com" },
        { Name: "custom:description", Value: "Fotógrafo" },
        { Name: "custom:avatar_key", Value: "avatars/user-123/foto.png" },
      ],
    });

    expect(profile).toMatchObject({
      id: "user-123",
      fullName: "João Silva",
      username: "jdoe",
      email: "joao@example.com",
      description: "Fotógrafo",
      avatarKey: "avatars/user-123/foto.png",
      profileImageUrl: null,
      createdAt: "2026-01-02T03:04:05.000Z",
    });
  });

  it("falls back when optional attributes are absent", () => {
    const profile = mapProfile({
      username: "maria",
      attributes: [{ Name: "sub", Value: "user-9" }],
    });

    expect(profile.fullName).toBe("");
    expect(profile.description).toBe("");
    expect(profile.avatarKey).toBeNull();
    expect(profile.createdAt).toBe("");
  });
});
