import "server-only";

import type { UpdateUserProfile, UserProfile } from "@/models/user.model";

/**
 * Persistência do perfil. O usuário é criado pelo cadastro no Cognito
 * (`cognitoRegistration.signUp`); o repositório apenas lê e altera o perfil.
 */
export interface UserRepository {
  findById(userId: string): Promise<UserProfile | null>;
  update(userId: string, input: UpdateUserProfile): Promise<UserProfile>;
  updateAvatarKey(userId: string, key: string): Promise<void>;
}
