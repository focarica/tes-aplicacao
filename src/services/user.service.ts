import "server-only";

import type { UpdateUserProfile, User } from "@/models/user.model";

/** Operações do próprio usuário; identidade obtida da sessão no servidor. */
export interface UserService {
  getCurrentProfile(): Promise<User>;
  updateCurrentProfile(input: UpdateUserProfile): Promise<User>;
}
