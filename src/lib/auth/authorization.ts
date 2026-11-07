import type { AuthenticatedUser } from "@/models/auth.model";

export interface VerifiedAccessClaims {
  sub?: unknown;
  username?: unknown;
}

export function principalFromVerifiedClaims(claims: VerifiedAccessClaims): AuthenticatedUser | null {
  if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;
  return { userId: claims.sub };
}

export function assertOwnResource(user: AuthenticatedUser, resourceOwnerId: string): void {
  if (user.userId !== resourceOwnerId) {
    throw new Error("FORBIDDEN");
  }
}
