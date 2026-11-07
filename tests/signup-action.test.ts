import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signUp: vi.fn(), reportAuthError: vi.fn() }));

vi.mock("@/lib/auth/registration", () => ({ cognitoRegistration: { signUp: mocks.signUp } }));
vi.mock("@/lib/auth/diagnostics", () => ({ reportAuthError: mocks.reportAuthError }));

import { signUpAction } from "../src/app/actions/signup";

beforeEach(() => vi.clearAllMocks());

describe("signup action failures", () => {
  it.each([
    ["UsernameExistsException", "nome de usuário já está cadastrado"],
    ["EmailExistsException", "email já está cadastrado"],
    ["InvalidPasswordException", "política de segurança"],
    ["CodeDeliveryFailureException", "enviar o código"],
    ["CognitoConfigurationError", "variáveis de ambiente"],
  ])("returns a specific message for %s", async (name, expected) => {
    const error = { name };
    mocks.signUp.mockRejectedValue(error);
    const data = new FormData();
    data.set("fullName", "Ana Silva");
    data.set("username", "ana");
    data.set("email", "ana@example.com");
    data.set("password", "Long-password1!");

    const state = await signUpAction({}, data);
    expect(state.error).toContain(expected);
    expect(state.username).toBeUndefined();
    expect(mocks.reportAuthError).toHaveBeenCalledWith("signup", error);
  });
});
