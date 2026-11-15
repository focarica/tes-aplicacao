export const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB
export const MAX_OTHER_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const ALLOWED_PREFIXES = ["image/", "video/"];
const ALLOWED_EXACT = [
  "application/pdf",
  "application/zip",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function kindOf(mime: string): "image" | "video" | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

/** Retorna a mensagem de erro ou null quando o upload é aceito. */
export function validateUpload(mime: string, size: number): string | null {
  if (!mime) return "Tipo do arquivo não informado.";
  const allowed =
    ALLOWED_PREFIXES.some((prefix) => mime.startsWith(prefix)) ||
    ALLOWED_EXACT.includes(mime);
  if (!allowed) return `Tipo de arquivo não permitido (${mime}).`;

  const limit = mime.startsWith("image/")
    ? MAX_IMAGE_BYTES
    : mime.startsWith("video/")
      ? MAX_VIDEO_BYTES
      : MAX_OTHER_BYTES;
  if (size <= 0) return "Arquivo vazio.";
  if (size > limit) {
    return `Arquivo muito grande (máximo ${Math.round(limit / 1024 / 1024)} MB).`;
  }
  return null;
}

/** Retorna a mensagem de erro ou null quando a foto de perfil é aceita. */
export function validateAvatar(mime: string, size: number): string | null {
  if (!AVATAR_TYPES.includes(mime)) {
    return "Envie uma imagem JPEG, PNG, WebP ou GIF.";
  }
  if (size <= 0) return "Arquivo vazio.";
  if (size > MAX_AVATAR_BYTES) {
    return `Imagem muito grande (máximo ${Math.round(MAX_AVATAR_BYTES / 1024 / 1024)} MB).`;
  }
  return null;
}
