export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  description: string;
  createdAt: string;
}

export type UpdateUserProfile = Pick<
  User,
  "fullName" | "username" | "email" | "profileImageUrl" | "description"
>;
