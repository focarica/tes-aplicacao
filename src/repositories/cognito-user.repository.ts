import "server-only";

import type { UserRepository } from "@/repositories/user.repository";
import {
  getProfile,
  updateProfile,
  updateAvatarKey as saveAvatarKey,
} from "@/lib/auth/profile";

/** Sessão já verificada no servidor: o `sub` do Cognito e o access token. */
export interface CognitoSession {
  userId: string;
  accessToken: string;
}

function forbidden() {
  return Object.assign(new Error("FORBIDDEN"), { name: "ForbiddenError" });
}

/**
 * Repositório de perfil sobre os atributos do Cognito. É criado a cada
 * requisição com a sessão verificada e só acessa o perfil do próprio usuário.
 */
export function createCognitoUserRepository(session: CognitoSession): UserRepository {
  function assertSelf(userId: string) {
    if (userId !== session.userId) throw forbidden();
  }

  return {
    async findById(userId) {
      if (userId !== session.userId) return null;
      return getProfile(session.accessToken);
    },

    async update(userId, input) {
      assertSelf(userId);
      await updateProfile(session.accessToken, input);
      return getProfile(session.accessToken);
    },

    async updateAvatarKey(userId, key) {
      assertSelf(userId);
      await saveAvatarKey(session.accessToken, key);
    },
  };
}
