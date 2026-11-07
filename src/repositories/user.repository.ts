import "server-only";

import type { UpdateUserProfile, User } from "@/models/user.model";

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(userId: string, input: UpdateUserProfile): Promise<User>;
}
