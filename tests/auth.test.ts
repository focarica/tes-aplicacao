import { describe, expect, it } from "vitest";
import { assertOwnResource, principalFromVerifiedClaims } from "../src/lib/auth/authorization";
import { signInSchema, signUpSchema } from "../src/lib/auth/validation";

describe("authentication input validation", () => {
  it("accepts email and password for login", () => {
    expect(signInSchema.safeParse({ email: "ana@example.com", password: "long-password" }).success).toBe(true);
  });

  it("rejects username in place of the configured email login", () => {
    expect(signInSchema.safeParse({ username: "ana", password: "long-password" }).success).toBe(false);
  });

  it("requires registration profile fields and a valid email", () => {
    expect(signUpSchema.safeParse({
      username: "ana",
      fullName: "Ana Silva",
      email: "ana@example.com",
      password: "Long-password1!",
    }).success).toBe(true);
    expect(signUpSchema.safeParse({
      username: "ana",
      fullName: "Ana Silva",
      email: "not-an-email",
      password: "Long-password1!",
    }).success).toBe(false);
  });
});

describe("authorization", () => {
  it("uses the subject from verified claims as the authenticated identity", () => {
    expect(principalFromVerifiedClaims({ sub: "user-sub", username: "ana" })).toEqual({ userId: "user-sub" });
    expect(principalFromVerifiedClaims({ username: "ana" })).toBeNull();
  });

  it("allows access to an owned resource and rejects a different owner", () => {
    const user = { userId: "user-sub" };
    expect(() => assertOwnResource(user, "user-sub")).not.toThrow();
    expect(() => assertOwnResource(user, "another-user")).toThrow("FORBIDDEN");
  });
});
