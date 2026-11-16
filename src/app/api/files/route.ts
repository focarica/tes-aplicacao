import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { deleteFile, listFiles } from "@/lib/aws/s3";

const keySchema = z.string().min(1).max(1024);

function errorName(error: unknown) {
  return error !== null && typeof error === "object" && "name" in error
    ? String((error as { name: unknown }).name)
    : "";
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    return NextResponse.json({ files: await listFiles(user.userId) });
  } catch (error) {
    if (errorName(error) === "S3ConfigurationError") {
      return NextResponse.json({ error: "O armazenamento não está configurado." }, { status: 500 });
    }
    console.error("list files failed", error);
    return NextResponse.json({ error: "Não foi possível carregar os arquivos." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const key = new URL(request.url).searchParams.get("key");
  const parsed = keySchema.safeParse(key);
  if (!parsed.success) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  try {
    await deleteFile(user.userId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (errorName(error) === "ForbiddenError") {
      return NextResponse.json({ error: "Sem permissão para excluir este arquivo." }, { status: 403 });
    }
    if (errorName(error) === "S3ConfigurationError") {
      return NextResponse.json({ error: "O armazenamento não está configurado." }, { status: 500 });
    }
    console.error("delete file failed", error);
    return NextResponse.json({ error: "Não foi possível excluir o arquivo." }, { status: 500 });
  }
}
