import type { FileRecord } from "@/models/file.model";
import { kindOf } from "@/lib/media";

/** Pré-carrega as imagens para a galeria aparecer completa, sem desenho progressivo. */
export async function preloadGalleryImages(files: FileRecord[]) {
  await Promise.all(
    files
      .filter((file) => kindOf(file.mimeType) === "image" && file.viewUrl)
      .map(
        (file) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = file.viewUrl as string;
          }),
      ),
  );
}
