import { describe, expect, it } from "vitest";
import { kindOf, MAX_AVATAR_BYTES, MAX_IMAGE_BYTES, MAX_OTHER_BYTES, MAX_VIDEO_BYTES, validateAvatar, validateUpload } from "../src/lib/media";

describe("media classification", () => {
  it("classifies images, videos and documents", () => {
    expect(kindOf("image/png")).toBe("image");
    expect(kindOf("video/mp4")).toBe("video");
    expect(kindOf("application/pdf")).toBe("other");
  });
});

describe("upload validation", () => {
  it("accepts allowed types within their size limit", () => {
    expect(validateUpload("image/png", 1024)).toBeNull();
    expect(validateUpload("video/mp4", MAX_VIDEO_BYTES)).toBeNull();
    expect(validateUpload("application/pdf", 1024)).toBeNull();
  });

  it("rejects unknown or empty types", () => {
    expect(validateUpload("", 1024)).toContain("não informado");
    expect(validateUpload("application/x-msdownload", 1024)).toContain("não permitido");
  });

  it("rejects empty and oversized files per kind", () => {
    expect(validateUpload("image/png", 0)).toContain("vazio");
    expect(validateUpload("image/png", MAX_IMAGE_BYTES + 1)).toContain("muito grande");
    expect(validateUpload("video/mp4", MAX_VIDEO_BYTES + 1)).toContain("muito grande");
    expect(validateUpload("application/pdf", MAX_OTHER_BYTES + 1)).toContain("muito grande");
    expect(validateUpload("application/pdf", MAX_OTHER_BYTES)).toBeNull();
  });
});

describe("avatar validation", () => {
  it("accepts common image formats within the limit", () => {
    expect(validateAvatar("image/jpeg", 1024)).toBeNull();
    expect(validateAvatar("image/png", MAX_AVATAR_BYTES)).toBeNull();
    expect(validateAvatar("image/webp", 1024)).toBeNull();
  });

  it("rejects non-images, empty and oversized avatars", () => {
    expect(validateAvatar("image/svg+xml", 1024)).toContain("JPEG");
    expect(validateAvatar("application/pdf", 1024)).toContain("JPEG");
    expect(validateAvatar("image/png", 0)).toContain("vazio");
    expect(validateAvatar("image/png", MAX_AVATAR_BYTES + 1)).toContain("muito grande");
  });
});
