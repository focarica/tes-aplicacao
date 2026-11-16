/** Item exibido na galeria. Contrato de leitura, ainda sem persistência. */
export interface FileRecord {
  id: string;
  userId: string;
  s3Key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** Data ISO 8601 definida pelo servidor. */
  createdAt: string;
  viewUrl?: string;
}
