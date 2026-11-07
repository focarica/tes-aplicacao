/** Identidade associada ao `sub` imutável do usuário no Cognito. */
export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  description: string;
  /** Data ISO 8601 definida pelo servidor. */
  createdAt: string;
}

// Senhas pertencem apenas aos DTOs de entrada e ao Cognito, nunca ao perfil.
export type UpdateUserProfile = Pick<
  User,
  "fullName" | "username" | "email" | "profileImageUrl" | "description"
>;
