import { afterEach, describe, expect, it, vi } from "vitest";
import { userFacingError } from "../src/lib/auth/errors";
import { reportAuthError } from "../src/lib/auth/diagnostics";

afterEach(() => vi.restoreAllMocks());

describe("authentication error messages", () => {
  it("explains duplicate usernames and email aliases", () => {
    expect(userFacingError({ name: "UsernameExistsException" }, "signup")).toContain("nome de usuário já está cadastrado");
    expect(userFacingError({ name: "AliasExistsException" }, "confirm")).toContain("email já está associado");
  });

  it.each([
    ["InvalidPasswordException", "política de segurança"],
    ["CodeDeliveryFailureException", "cadastro pode ter sido criado"],
    ["TooManyRequestsException", "Muitas tentativas"],
    ["CognitoConfigurationError", "variáveis de ambiente"],
    ["CodeMismatchException", "Código de confirmação inválido"],
    ["ExpiredCodeException", "expirou"],
  ])("handles %s", (name, expected) => {
    expect(userFacingError({ name })).toContain(expected);
  });

  it("keeps login errors generic about account existence", () => {
    expect(userFacingError({ name: "UserNotFoundException" }, "signin"))
      .toBe(userFacingError({ name: "NotAuthorizedException" }, "signin"));
  });

  it("distinguishes a rejected public signup from invalid login credentials", () => {
    expect(userFacingError({ name: "NotAuthorizedException" }, "signup")).toContain("cadastro público");
    expect(userFacingError({ name: "NotAuthorizedException" }, "signin")).toBe("Email ou senha inválidos.");
  });

  it.each([
    ["Client configured with secret but SECRET_HASH was not received", "client secret"],
    ["Attributes did not conform to the schema: nickname: The attribute is required", "atributos obrigatórios"],
    ["Username should be an email", "identificadores de login"],
  ])("recognizes configuration failures without exposing the provider message", (message, expected) => {
    expect(userFacingError({ name: "InvalidParameterException", message }, "signup")).toContain(expected);
    expect(userFacingError({ name: "InvalidParameterException", message }, "signup")).not.toContain(message);
  });

  it("does not expose unknown error details", () => {
    const message = "secret-token user@example.com";
    expect(userFacingError(new Error(message))).not.toContain(message);
  });

  it("logs only diagnostic metadata, not credentials or provider messages", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    reportAuthError("signup", {
      name: "InvalidParameterException",
      message: "Client secret mismatch: secret-value user@example.com",
      password: "private-password",
      $metadata: { requestId: "request-id", httpStatusCode: 400 },
    });
    expect(log).toHaveBeenCalledWith("[auth]", {
      operation: "signup",
      name: "InvalidParameterException",
      diagnostic: "APP_CLIENT_SECRET_MISMATCH",
      requestId: "request-id",
      httpStatusCode: 400,
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret-value|user@example.com|private-password/);
  });
});
