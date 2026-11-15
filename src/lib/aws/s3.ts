import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import type { FileRecord } from "@/models/file.model";
import { validateUpload } from "@/lib/media";

const envSchema = z.object({
  AWS_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
});

function getS3Config() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw Object.assign(new Error("S3 is not configured."), { name: "S3ConfigurationError" });
  }
  return parsed.data;
}

function getClient() {
  const { AWS_REGION } = getS3Config();
  return new S3Client({ region: AWS_REGION });
}

function userPrefix(userId: string) {
  return `uploads/${userId}/`;
}

export function assertKeyOwnership(userId: string, key: string) {
  if (!key.startsWith(userPrefix(userId)) || key.includes("..")) {
    throw Object.assign(new Error("FORBIDDEN"), { name: "ForbiddenError" });
  }
}

function safeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-150);
  return cleaned || "arquivo";
}

function filenameFromKey(key: string) {
  const base = key.slice(key.lastIndexOf("/") + 1);
  const separator = base.indexOf("__");
  return separator === -1 ? base : base.slice(separator + 2);
}

export async function presignUpload(
  userId: string,
  input: { filename: string; contentType: string; size: number },
) {
  const error = validateUpload(input.contentType, input.size);
  if (error) throw Object.assign(new Error(error), { name: "UploadValidationError" });

  // shortcut: o tamanho é validado aqui, mas o PUT pré-assinado não fixa
  // Content-Length; para garantir o limite, assinar ContentLength ou usar POST policy.
  const { S3_BUCKET } = getS3Config();
  const key = `${userPrefix(userId)}${randomUUID()}__${safeFilename(input.filename)}`;
  const putUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: input.contentType }),
    { expiresIn: 300 },
  );
  return { putUrl, key };
}

export async function listFiles(userId: string): Promise<FileRecord[]> {
  const { S3_BUCKET } = getS3Config();
  const client = getClient();
  const prefix = userPrefix(userId);
  const keys: string[] = [];
  let token: string | undefined;

  // shortcut: pagina todo o prefixo do usuário; suficiente para a galeria atual.
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const item of page.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    token = page.NextContinuationToken;
  } while (token);

  const files = await Promise.all(
    keys.map(async (key): Promise<FileRecord | null> => {
      try {
        const head = await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
        const viewUrl = await getSignedUrl(
          client,
          new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
          { expiresIn: 3600 },
        );
        return {
          id: key,
          userId,
          s3Key: key,
          filename: filenameFromKey(key),
          mimeType: head.ContentType ?? "application/octet-stream",
          sizeBytes: head.ContentLength ?? 0,
          createdAt: (head.LastModified ?? new Date()).toISOString(),
          viewUrl,
        };
      } catch {
        return null;
      }
    }),
  );

  return files
    .filter((file): file is FileRecord => file !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteFile(userId: string, key: string) {
  assertKeyOwnership(userId, key);
  const { S3_BUCKET } = getS3Config();
  await getClient().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}
