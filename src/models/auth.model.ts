export interface SignInInput {
  username: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  fullName: string;
  email: string;
}

export interface ConfirmSignUpInput {
  username: string;
  code: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Contexto produzido no servidor após validar a sessão, nunca pelo formulário. */
export interface AuthenticatedUser {
  userId: string;
}

export interface SignUpResult {
  userId: string;
  requiresConfirmation: boolean;
}

// Login pode exigir confirmação, nova senha ou MFA; não presumir sucesso direto.
export type SignInResult =
  | { status: "authenticated"; user: AuthenticatedUser }
  | { status: "challenge-required"; challenge: string };
