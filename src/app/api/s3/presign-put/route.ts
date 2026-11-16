import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { presignAvatar, presignUpload } from "@/lib/aws/s3";

const schema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
  scope: z.enum(["gallery", "avatar"]).default("gallery"),
});

function errorName(error: unknown) {
  return error !== null && typeof error === "object" && "name" in error
    ? String((error as { name: unknown }).name)
    : "";
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do arquivo inválidos." }, { status: 400 });
  }

  try {
    const { scope, ...input } = parsed.data;
    const result = scope === "avatar"
      ? await presignAvatar(user.userId, input)
      : await presignUpload(user.userId, input);
    return NextResponse.json(result);
  } catch (error) {
    const name = errorName(error);
    if (name === "UploadValidationError") {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    if (name === "S3ConfigurationError") {
      return NextResponse.json({ error: "O armazenamento não está configurado." }, { status: 500 });
    }
    console.error("presign upload failed", error);
    return NextResponse.json({ error: "Não foi possível preparar o upload." }, { status: 500 });
  }
}
