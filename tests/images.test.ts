import { afterEach, describe, expect, it, vi } from "vitest";
import type { FileRecord } from "../src/models/file.model";
import { preloadGalleryImages } from "../src/lib/images";

function record(overrides: Partial<FileRecord>): FileRecord {
  return {
    id: "file-1",
    userId: "user-1",
    s3Key: "uploads/user-1/file",
    filename: "arquivo",
    mimeType: "image/png",
    sizeBytes: 1024,
    createdAt: "2026-01-01T00:00:00.000Z",
    viewUrl: "https://example.com/arquivo",
    ...overrides,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("gallery image preload", () => {
  it("waits for images and skips documents", async () => {
    const requested: string[] = [];
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(value: string) {
          requested.push(value);
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    await preloadGalleryImages([
      record({ viewUrl: "https://example.com/foto.png" }),
      record({ id: "file-2", mimeType: "application/pdf", viewUrl: "https://example.com/doc.pdf" }),
      record({ id: "file-3", mimeType: "image/jpeg", viewUrl: undefined }),
    ]);

    expect(requested).toEqual(["https://example.com/foto.png"]);
  });
});
