import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface StorageUploadOptions {
  fileName: string;
  fileSize: number;
  fileType: string;
  organizationId: string;
  buffer?: Buffer;
}

export interface StorageUploadResult {
  storageKey: string;
  storageUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  virusScanStatus: "CLEAN" | "FLAGGED";
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Video & Audio
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  // Documents & Archives
  "application/pdf",
  "text/plain",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

const SECRET_SALT = process.env.SESSION_SECRET || "karyalaya-storage-signing-secret-2026";

export class StorageService {
  /**
   * Validate file size and MIME type
   */
  static validateFile(fileSize: number, fileType: string) {
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum allowed size of 50MB. (Received: ${Math.round(fileSize / (1024 * 1024))}MB)`);
    }
    const cleanType = fileType.toLowerCase().split(";")[0].trim();
    if (cleanType && !ALLOWED_MIME_TYPES.has(cleanType) && !cleanType.startsWith("image/") && !cleanType.startsWith("video/")) {
      throw new Error(`Unsupported file format '${fileType}'. Please upload an image, video, PDF, or zip archive.`);
    }
  }

  /**
   * Virus scan hook placeholder (simulates asynchronous security inspection)
   */
  static async scanFileForViruses(storageKey: string): Promise<"CLEAN" | "FLAGGED"> {
    // In production, integrate ClamAV / AWS GuardDuty / VirusTotal API
    // Check for obvious malicious test signatures
    if (storageKey.includes("eicar") || storageKey.includes("malware-test")) {
      console.warn(`🚨 [VIRUS_SCAN] Flagged suspicious payload on ${storageKey}`);
      return "FLAGGED";
    }
    // Clean
    return "CLEAN";
  }

  /**
   * Generate an encrypted signed token for permission-checked time-limited URL access
   */
  static generateSignedToken(fileId: string, organizationId: string, expiresInSeconds: number = 3600): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${fileId}:${organizationId}:${expiresAt}`;
    const signature = crypto.createHmac("sha256", SECRET_SALT).update(payload).digest("hex");
    return Buffer.from(`${payload}:${signature}`).toString("base64url");
  }

  /**
   * Verify a signed token
   */
  static verifySignedToken(token: string): { valid: boolean; fileId?: string; organizationId?: string; expired?: boolean } {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      const [fileId, organizationId, expiresAtStr, signature] = decoded.split(":");
      if (!fileId || !organizationId || !expiresAtStr || !signature) {
        return { valid: false };
      }

      const payload = `${fileId}:${organizationId}:${expiresAtStr}`;
      const expectedSig = crypto.createHmac("sha256", SECRET_SALT).update(payload).digest("hex");

      if (signature !== expectedSig) {
        return { valid: false };
      }

      const expiresAt = parseInt(expiresAtStr, 10);
      if (Math.floor(Date.now() / 1000) > expiresAt) {
        return { valid: false, expired: true, fileId, organizationId };
      }

      return { valid: true, fileId, organizationId };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Save uploaded file locally or in object storage
   */
  static async saveFile(options: StorageUploadOptions): Promise<StorageUploadResult> {
    this.validateFile(options.fileSize, options.fileType);

    const ext = path.extname(options.fileName) || "";
    const key = `org_${options.organizationId}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    const virusStatus = await this.scanFileForViruses(key);

    // Save to local upload directory as fallback S3 emulator
    const uploadsDir = path.join(process.cwd(), "public", "uploads", `org_${options.organizationId}`);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(process.cwd(), "public", "uploads", key);
    const parentDir = path.dirname(localFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (options.buffer) {
      fs.writeFileSync(localFilePath, options.buffer);
    } else {
      // Placeholder data
      fs.writeFileSync(localFilePath, Buffer.from(`KaryaLaya Storage Placeholder for ${options.fileName}`));
    }

    const storageUrl = `/uploads/${key}`;

    return {
      storageKey: key,
      storageUrl,
      fileName: options.fileName,
      fileSize: options.fileSize,
      fileType: options.fileType,
      virusScanStatus: virusStatus,
    };
  }
}
