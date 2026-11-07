import "server-only";

import type { UpdateUserProfile, User } from "@/models/user.model";

/** Porta de persistência do perfil; implementação e banco ainda não definidos. */
export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(userId: string, input: UpdateUserProfile): Promise<User>;
}
