const messages: Record<string, string> = {
  EmailExistsException: "Este email já está cadastrado. Entre na sua conta ou use outro email.",
  CredentialsProviderError: "A consulta de email exige credenciais AWS no servidor. Configure o perfil AWS ou a IAM Role da aplicação.",
  AccessDeniedException: "O servidor não tem permissão para consultar os emails cadastrados. Verifique a permissão IAM cognito-idp:ListUsers.",
  UnrecognizedClientException: "As credenciais AWS do servidor são inválidas ou expiraram.",
  ExpiredTokenException: "As credenciais AWS do servidor expiraram. Renove a sessão AWS.",
  NotAuthorizedException: "Email ou senha inválidos.",
  UserNotFoundException: "Email ou senha inválidos.",
  UserNotConfirmedException: "Confirme seu cadastro antes de entrar.",
  UsernameExistsException: "Este nome de usuário já está cadastrado. Escolha outro ou entre na sua conta.",
  AliasExistsException: "Este email já está associado a outra conta. Use outro email ou entre na sua conta.",
  InvalidPasswordException: "A senha não atende à política de segurança. Confira os requisitos de tamanho, letras maiúsculas e minúsculas, números e símbolos do cadastro.",
  CodeMismatchException: "Código de confirmação inválido. Confira o código recebido por email.",
  ExpiredCodeException: "O código de confirmação expirou.",
  TooManyRequestsException: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
  LimitExceededException: "O limite de tentativas foi atingido. Aguarde e tente novamente.",
  CodeDeliveryFailureException: "Não foi possível enviar o código de confirmação. O cadastro pode ter sido criado; verifique seu email antes de tentar novamente.",
  InvalidEmailRoleAccessPolicyException: "O envio de email do cadastro está indisponível. A configuração de envio precisa ser revisada.",
  ResourceNotFoundException: "O serviço de autenticação está configurado incorretamente. Verifique o User Pool e o App Client.",
  CognitoConfigurationError: "O serviço de autenticação não está configurado. Verifique as variáveis de ambiente no servidor.",
  InternalErrorException: "O serviço de autenticação está temporariamente indisponível. Tente novamente em alguns minutos.",
  NetworkError: "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
  TimeoutError: "O serviço de autenticação demorou para responder. Tente novamente.",
};

function errorRecord(error: unknown): Record<string, unknown> {
  return error !== null && typeof error === "object" ? error as Record<string, unknown> : {};
}

export function authErrorName(error: unknown): string {
  const { name } = errorRecord(error);
  return typeof name === "string" ? name : "UnknownError";
}

export function authErrorDiagnostic(error: unknown): string | undefined {
  const { message } = errorRecord(error);
  if (typeof message !== "string") return undefined;
  if (/secret.?hash|client.*secret/i.test(message)) return "APP_CLIENT_SECRET_MISMATCH";
  if (/attributes? .*required|required.*attributes?|missing required/i.test(message)) return "REQUIRED_ATTRIBUTES_MISMATCH";
  if (/username.*email|email.*username/i.test(message)) return "SIGN_IN_IDENTIFIERS_MISMATCH";
  if (/auth flow.*not enabled/i.test(message)) return "AUTH_FLOW_DISABLED";
  return undefined;
}

export function userFacingError(error: unknown, operation?: "signup" | "confirm" | "signin") {
  const name = authErrorName(error);
  const diagnostic = authErrorDiagnostic(error);
  if (diagnostic === "APP_CLIENT_SECRET_MISMATCH") {
    return "A configuração do App Client está inválida. Verifique o client secret no servidor.";
  }
  if (diagnostic === "REQUIRED_ATTRIBUTES_MISMATCH") {
    return "O Cognito exige dados que este cadastro não envia. Revise os atributos obrigatórios do User Pool.";
  }
  if (diagnostic === "SIGN_IN_IDENTIFIERS_MISMATCH") {
    return "O User Pool não corresponde ao cadastro com username e email. Revise os identificadores de login no Cognito.";
  }
  if (diagnostic === "AUTH_FLOW_DISABLED") {
    return "O login por senha não está habilitado no App Client do Cognito.";
  }
  if (name === "InvalidParameterException") {
    return "O serviço de autenticação recusou os dados. Confira os campos e a configuração do User Pool.";
  }
  if (name === "NotAuthorizedException" && operation === "signup") {
    return "O cadastro foi recusado pelo Cognito. Verifique se o cadastro público está habilitado e se o App Client está configurado corretamente.";
  }
  return messages[name] ?? "Não foi possível concluir a operação. Tente novamente. Se persistir, consulte o diagnóstico no servidor.";
}
