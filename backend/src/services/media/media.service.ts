import { mediaAssetRepository } from '../../repositories';
import { env } from '../../config/env';
import { isImageFile, isVideoFile, getFileCategory } from '../../utils/fileType';

export const mediaService = {
  async upload(file: Express.Multer.File): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      // NOTE: MediaAsset's real fields are fileName/fileSize (not
      // filename/size), it has no `uploadedAt` column (createdAt is
      // auto-set), and `fileType` (required, e.g. "image"/"video") is what
      // getFileCategory()'s result actually maps to — not the unrelated
      // `category` field (that one groups assets as hero/vehicle/gallery/etc).
      const fileType = getFileCategory(file.originalname);

      const mediaAsset = await mediaAssetRepository.create({
        fileName: file.filename,
        originalName: file.originalname,
        fileType,
        mimeType: file.mimetype,
        fileSize: file.size,
        url: `/uploads/${file.filename}`,
      });

      return { ok: true, data: mediaAsset };
    } catch (error: any) {
      console.error('[MEDIA UPLOAD ERROR]', error.message);
      return { ok: false, error: 'Failed to upload media.' };
    }
  },

  async list(params?: { category?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where: any = {};
      if (params?.category) where.category = params.category;

      const assets = await mediaAssetRepository.findMany(where);
      return { ok: true, data: assets };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch media assets.' };
    }
  },

  getFileInfo(filename: string) {
    return {
      isImage: isImageFile(filename),
      isVideo: isVideoFile(filename),
      category: getFileCategory(filename),
    };
  },
};
