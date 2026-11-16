import "server-only";

import { authErrorDiagnostic, authErrorName } from "@/lib/auth/errors";

export function reportAuthError(operation: string, error: unknown) {
  const record = error !== null && typeof error === "object" ? error as Record<string, unknown> : {};
  const metadata = record.$metadata !== null && typeof record.$metadata === "object"
    ? record.$metadata as Record<string, unknown>
    : {};

  console.error("[auth]", {
    operation,
    name: authErrorName(error),
    diagnostic: authErrorDiagnostic(error),
    requestId: typeof metadata.requestId === "string" ? metadata.requestId : undefined,
    httpStatusCode: typeof metadata.httpStatusCode === "number" ? metadata.httpStatusCode : undefined,
  });
}
