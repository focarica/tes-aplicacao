import "server-only";

import { cookies } from "next/headers";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoTokens } from "@/models/auth.model";
import { getCognitoConfig } from "@/lib/auth/config";
import { principalFromVerifiedClaims } from "@/lib/auth/authorization";

const ACCESS_COOKIE = "tes_access_token";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(tokens: CognitoTokens) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn));
}

export async function clearSession() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { ...cookieOptions(0), expires: new Date(0) });
}

export async function getAuthenticatedUser() {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const { AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } = getCognitoConfig();
    const verifier = CognitoJwtVerifier.create({
      userPoolId: COGNITO_USER_POOL_ID,
      tokenUse: "access",
      clientId: COGNITO_CLIENT_ID,
      region: AWS_REGION,
    });
    const payload = await verifier.verify(accessToken);
    return principalFromVerifiedClaims(payload);
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return user;
}
