import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import type { StorageDriver } from "./storage-driver.interface";

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly root = path.resolve(
    process.env.STORAGE_LOCAL_PATH ?? "./storage/uploads",
  );

  async save(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.root, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(path.join(this.root, key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(path.join(this.root, key), { force: true });
  }
}
