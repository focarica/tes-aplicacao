import "server-only";

import type {
  AuthenticatedUser,
  ChangePasswordInput,
  ConfirmSignUpInput,
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from "@/models/auth.model";

/** Contrato futuro do adaptador Cognito e da gestão de sessão no servidor. */
export interface AuthService {
  signUp(input: SignUpInput): Promise<SignUpResult>;
  confirmSignUp(input: ConfirmSignUpInput): Promise<void>;
  signIn(input: SignInInput): Promise<SignInResult>;
  signOut(): Promise<void>;
  requireUser(): Promise<AuthenticatedUser>;
  changePassword(input: ChangePasswordInput): Promise<void>;
}
