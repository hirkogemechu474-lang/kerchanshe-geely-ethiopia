import { env } from '../../config/env';
import { signLinkToken, verifyLinkToken } from '../../utils/secureLink';
import { salesOrderRepository } from '../../repositories';

export const uploadService = {
  getUploadDir(): string {
    return env.upload.dir;
  },

  getMaxFileSize(): number {
    return env.upload.maxFileSize;
  },

  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (file.size > env.upload.maxFileSize) {
      return { valid: false, error: `File size exceeds limit of ${env.upload.maxFileSize} bytes.` };
    }
    return { valid: true };
  },

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  },

  generateSecureLink(orderId: string, type: 'agreement' | 'payment' | 'handover'): string {
    const token = signLinkToken(type, orderId);
    return `/${type}/${orderId}?token=${token}`;
  },

  verifySecureLink(token: string, type: 'agreement' | 'payment' | 'handover', id: string): boolean {
    return verifyLinkToken(token, type, id);
  },
};
