export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

export interface ConfirmSignUpInput {
  username: string;
  code: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthenticatedUser {
  userId: string;
}

export interface SignUpResult {
  userId: string;
  requiresConfirmation: boolean;
}

export type SignInResult =
  | { status: "authenticated"; tokens: CognitoTokens }
  | { status: "challenge-required"; challenge: string; session?: string };

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}
