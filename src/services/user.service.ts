import "server-only";

import type { UpdateUserProfile, User, UserProfile } from "@/models/user.model";
import type { UserRepository } from "@/repositories/user.repository";
import { assertAvatarOwnership, avatarObject, deleteAvatar } from "@/lib/aws/s3";
import { MAX_AVATAR_BYTES } from "@/lib/media";

export interface UserService {
  getCurrentProfile(): Promise<User>;
  updateCurrentProfile(input: UpdateUserProfile): Promise<User>;
  updateCurrentAvatar(key: string): Promise<User>;
}

export interface UserServiceDependencies {
  userId: string;
  repository: UserRepository;
}

function namedError(name: string, message: string) {
  return Object.assign(new Error(message), { name });
}

/** Perfil enviado ao cliente: lista só os campos públicos, sem a chave da foto. */
function toPublicUser(profile: UserProfile): User {
  const { id, fullName, username, email, profileImageUrl, description, createdAt } = profile;
  return { id, fullName, username, email, profileImageUrl, description, createdAt };
}

/** Regras do perfil do usuário autenticado, independentes de HTTP e do Next.js. */
export function createUserService({ userId, repository }: UserServiceDependencies): UserService {
  async function loadProfile() {
    const profile = await repository.findById(userId);
    if (!profile) throw namedError("ProfileNotFoundError", "Profile not found.");
    return profile;
  }

  async function removeAvatar(key: string) {
    await deleteAvatar(userId, key).catch(() => {});
  }

  return {
    async getCurrentProfile() {
      return toPublicUser(await loadProfile());
    },

    async updateCurrentProfile(input) {
      return toPublicUser(await repository.update(userId, input));
    },

    async updateCurrentAvatar(key) {
      assertAvatarOwnership(userId, key);
      const object = await avatarObject(userId, key);
      if (!object.contentType.startsWith("image/") || object.sizeBytes <= 0) {
        await removeAvatar(key);
        throw namedError("AvatarValidationError", "Envie uma imagem válida.");
      }
      if (object.sizeBytes > MAX_AVATAR_BYTES) {
        await removeAvatar(key);
        throw namedError("AvatarValidationError", "Imagem muito grande (máximo 5 MB).");
      }

      const previous = await loadProfile();
      try {
        await repository.updateAvatarKey(userId, key);
      } catch (error) {
        await removeAvatar(key);
        throw error;
      }
      if (previous.avatarKey && previous.avatarKey !== key) {
        await removeAvatar(previous.avatarKey);
      }

      return toPublicUser(await loadProfile());
    },
  };
}
