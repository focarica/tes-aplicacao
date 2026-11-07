export function userFacingError(error: unknown) {
  if (error instanceof Error && ["NotAuthorizedException", "UserNotFoundException"].includes(error.name)) return "Email ou senha inválidos.";
  if (error instanceof Error && error.name === "UserNotConfirmedException") return "Confirme seu cadastro antes de entrar.";
  if (error instanceof Error && error.name === "UsernameExistsException") return "Não foi possível concluir o cadastro com esses dados.";
  if (error instanceof Error && error.name === "CodeMismatchException") return "Código de confirmação inválido.";
  if (error instanceof Error && error.name === "ExpiredCodeException") return "Código expirado. Solicite um novo código.";
  return "Não foi possível concluir a operação. Tente novamente.";
}
