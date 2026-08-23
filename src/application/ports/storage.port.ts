export interface IStoragePort {
  /**
   * Generates a pre-signed URL for direct upload from the client to the storage provider
   */
  createSignedUploadUrl(path: string, fileType: string): Promise<string>;
  
  /**
   * Generates a pre-signed URL to view/download a private file
   */
  createSignedDownloadUrl(path: string, expiresInMinutes?: number): Promise<string>;
  
  /**
   * Deletes a file from storage
   */
  deleteFile(path: string): Promise<void>;
}
