import { mediaAssetRepository } from '@/repositories/mediaAssetRepository';

export async function listMedia(filters: { fileType?: string | null; category?: string | null }) {
  return mediaAssetRepository.findMany({
    ...(filters.fileType && { fileType: filters.fileType }),
    ...(filters.category && { category: filters.category }),
  });
}
