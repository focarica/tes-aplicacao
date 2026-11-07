import "server-only";

import type { UpdateUserProfile, User } from "@/models/user.model";

export interface UserService {
  getCurrentProfile(): Promise<User>;
  updateCurrentProfile(input: UpdateUserProfile): Promise<User>;
}
