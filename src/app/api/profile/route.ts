import { NextResponse } from "next/server";
import { profileController } from "@/controllers/profile.controller";
import { readJsonObject, toJsonResponse } from "@/app/api/profile/response";

export async function GET() {
  return toJsonResponse(await profileController.getProfile());
}

export async function PATCH(request: Request) {
  const body = await readJsonObject(request);
  if (body instanceof NextResponse) return body;
  return toJsonResponse(await profileController.updateProfile(body));
}
