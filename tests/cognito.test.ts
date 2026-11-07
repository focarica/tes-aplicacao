import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  commands: [] as Array<{ name: string; input: Record<string, unknown> }>,
}));

vi.mock("@aws-sdk/client-cognito-identity-provider", () => {
  class Command {
    constructor(name: string, input: Record<string, unknown>) {
      mocks.commands.push({ name, input });
    }
  }
  return {
    CognitoIdentityProviderClient: class {
      send = mocks.send;
    },
    SignUpCommand: class extends Command {
      constructor(input: Record<string, unknown>) { super("SignUpCommand", input); }
    },
    ConfirmSignUpCommand: class extends Command {
      constructor(input: Record<string, unknown>) { super("ConfirmSignUpCommand", input); }
    },
    InitiateAuthCommand: class extends Command {
      constructor(input: Record<string, unknown>) { super("InitiateAuthCommand", input); }
    },
    GlobalSignOutCommand: class extends Command {
      constructor(input: Record<string, unknown>) { super("GlobalSignOutCommand", input); }
    },
  };
});

import { cognitoAuthProvider } from "../src/lib/auth/cognito";

describe("Cognito authentication adapter", () => {
  beforeEach(() => {
    process.env.AWS_REGION = "us-east-1";
    process.env.COGNITO_USER_POOL_ID = "us-east-1_testpool";
    process.env.COGNITO_CLIENT_ID = "test-client";
    delete process.env.COGNITO_CLIENT_SECRET;
    mocks.send.mockReset();
    mocks.commands.length = 0;
  });

  afterEach(() => {
    delete process.env.COGNITO_CLIENT_SECRET;
  });

  it("creates a Cognito user with username and profile attributes", async () => {
    mocks.send.mockResolvedValue({ UserSub: "new-sub", UserConfirmed: false });
    await expect(cognitoAuthProvider.signUp({
      username: "ana",
      fullName: "Ana Silva",
      email: "ana@example.com",
      password: "strong-password",
    })).resolves.toEqual({ userId: "new-sub", requiresConfirmation: true });
    expect(mocks.commands[0]).toMatchObject({
      name: "SignUpCommand",
      input: {
        Username: "ana",
        UserAttributes: [
          { Name: "email", Value: "ana@example.com" },
          { Name: "name", Value: "Ana Silva" },
        ],
      },
    });
  });

  it("authenticates with email and password and returns the Cognito tokens", async () => {
    mocks.send.mockResolvedValue({
      AuthenticationResult: { AccessToken: "access", IdToken: "id", RefreshToken: "refresh", ExpiresIn: 3600 },
    });
    await expect(cognitoAuthProvider.signIn({ email: "ana@example.com", password: "secret" })).resolves.toEqual({
      status: "authenticated",
      tokens: { accessToken: "access", idToken: "id", refreshToken: "refresh", expiresIn: 3600 },
    });
    expect(mocks.commands[0]).toMatchObject({
      name: "InitiateAuthCommand",
      input: {
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: { USERNAME: "ana@example.com", PASSWORD: "secret" },
      },
    });
  });

  it("confirms registration with the username and email verification code", async () => {
    mocks.send.mockResolvedValue({});
    await cognitoAuthProvider.confirmSignUp({ username: "ana", code: "123456" });
    expect(mocks.commands[0]).toEqual({
      name: "ConfirmSignUpCommand",
      input: {
        ClientId: "test-client",
        Username: "ana",
        ConfirmationCode: "123456",
        SecretHash: undefined,
      },
    });
  });

  it("rejects login when Cognito rejects the credentials", async () => {
    const error = Object.assign(new Error("Invalid credentials"), { name: "NotAuthorizedException" });
    mocks.send.mockRejectedValue(error);
    await expect(cognitoAuthProvider.signIn({ email: "ana@example.com", password: "incorrect" })).rejects.toBe(error);
  });

  it("rejects login before email confirmation", async () => {
    const error = Object.assign(new Error("Unconfirmed"), { name: "UserNotConfirmedException" });
    mocks.send.mockRejectedValue(error);
    await expect(cognitoAuthProvider.signIn({ email: "ana@example.com", password: "secret" })).rejects.toBe(error);
  });

  it("returns a challenge instead of treating incomplete authentication as a session", async () => {
    mocks.send.mockResolvedValue({ ChallengeName: "SMS_MFA", Session: "challenge-session" });
    await expect(cognitoAuthProvider.signIn({ email: "ana@example.com", password: "secret" })).resolves.toEqual({
      status: "challenge-required",
      challenge: "SMS_MFA",
      session: "challenge-session",
    });
  });

  it("revokes the Cognito session on logout", async () => {
    mocks.send.mockResolvedValue({});
    await cognitoAuthProvider.signOut("access-token");
    expect(mocks.commands[0]).toEqual({
      name: "GlobalSignOutCommand",
      input: { AccessToken: "access-token" },
    });
  });
});
