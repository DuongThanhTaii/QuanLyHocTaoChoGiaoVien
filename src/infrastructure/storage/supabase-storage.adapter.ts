import { IStoragePort } from '../../application/ports/storage.port';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseStorageAdapter implements IStoragePort {
  constructor(private client: SupabaseClient, private bucket: string = 'class_materials') {}

  async createSignedUploadUrl(path: string, fileType: string): Promise<string> {
    const { data, error } = await this.client
      .storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Failed to create signed upload URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async createSignedDownloadUrl(path: string, expiresInMinutes: number = 60): Promise<string> {
    const { data, error } = await this.client
      .storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInMinutes * 60);

    if (error) {
      throw new Error(`Failed to create signed download URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.client
      .storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
