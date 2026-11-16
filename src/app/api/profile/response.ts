import { NextResponse } from "next/server";
import type { ControllerResult } from "@/controllers/profile.controller";
import type { User } from "@/models/user.model";

const JSON_REQUIRED = "Envie os dados em JSON.";

/**
 * Lê o corpo como objeto JSON. Exigir `application/json` faz o navegador
 * pedir verificação prévia (CORS) em requisições de outros sites.
 */
export async function readJsonObject(request: Request): Promise<object | NextResponse> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: JSON_REQUIRED }, { status: 415 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: JSON_REQUIRED }, { status: 400 });
  }
  return body;
}

/** Converte o resultado do controller em resposta HTTP, no formato `{ error }` das demais rotas. */
export function toJsonResponse(result: ControllerResult<User>): NextResponse {
  if (result.ok) return NextResponse.json({ profile: result.data });
  return NextResponse.json({ error: result.error }, { status: result.status });
}
