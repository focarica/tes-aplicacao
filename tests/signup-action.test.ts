import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  reportAuthError: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("@/lib/auth/registration", () => ({ cognitoRegistration: { signUp: mocks.signUp } }));
vi.mock("@/lib/auth/diagnostics", () => ({ reportAuthError: mocks.reportAuthError }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { signUpAction } from "../src/app/actions/signup";

function signupData() {
  const data = new FormData();
  data.set("fullName", "Ana Silva");
  data.set("username", "ana");
  data.set("email", "ana@example.com");
  data.set("password", "senha-simples");
  data.set("description", "Fotógrafa");
  return data;
}

beforeEach(() => vi.clearAllMocks());

describe("signup action failures", () => {
  it.each([
    ["UsernameExistsException", "nome de usuário já está cadastrado"],
    ["EmailExistsException", "email já está cadastrado"],
    ["InvalidPasswordException", "não foi aceita pelo Cognito"],
    ["CodeDeliveryFailureException", "enviar o código"],
    ["CognitoConfigurationError", "variáveis de ambiente"],
  ])("returns a specific message for %s", async (name, expected) => {
    const error = { name };
    mocks.signUp.mockRejectedValue(error);

    const state = await signUpAction({}, signupData());
    expect(state.error).toContain(expected);
    expect(state.username).toBeUndefined();
    expect(mocks.reportAuthError).toHaveBeenCalledWith("signup", error);
  });
});

describe("signup action success", () => {
  it("redirects to the confirmation page with the registered username", async () => {
    mocks.signUp.mockResolvedValue({ userId: "user-1", requiresConfirmation: true });

    await expect(signUpAction({}, signupData())).rejects.toThrow(
      "REDIRECT:/confirm-signup?username=ana",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/confirm-signup?username=ana");
  });

  it("asks the user to sign in when confirmation is not required", async () => {
    mocks.signUp.mockResolvedValue({ userId: "user-1", requiresConfirmation: false });

    const state = await signUpAction({}, signupData());
    expect(state.message).toContain("já pode entrar");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
