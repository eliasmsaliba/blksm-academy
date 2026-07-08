export interface StorageDriver {
  /** Persist a file buffer under a storage key, returning the key used. */
  save(key: string, buffer: Buffer): Promise<string>;
  /** Read a file back out by its storage key. */
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export const STORAGE_DRIVER = Symbol("STORAGE_DRIVER");
