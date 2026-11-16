import { NextResponse } from "next/server";
import { profileController } from "@/controllers/profile.controller";
import { readJsonObject, toJsonResponse } from "@/app/api/profile/response";

/**
 * Troca a foto do perfil. A `key` vem de POST /api/s3/presign-put com
 * `scope: "avatar"`, depois que o navegador envia o arquivo ao S3.
 */
export async function PUT(request: Request) {
  const body = await readJsonObject(request);
  if (body instanceof NextResponse) return body;
  return toJsonResponse(await profileController.updateAvatar(body));
}
