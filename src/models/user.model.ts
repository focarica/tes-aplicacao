export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  description: string;
  createdAt: string;
}

export type UpdateUserProfile = Pick<User, "fullName" | "description">;

/** Perfil interno do usuário; a chave do avatar não é enviada ao cliente. */
export interface UserProfile extends User {
  avatarKey: string | null;
}
