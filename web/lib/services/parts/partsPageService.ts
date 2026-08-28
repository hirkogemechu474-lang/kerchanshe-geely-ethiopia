import { partsPageRepository } from '@/repositories/partsPageRepository';

// GET - Fetch all data needed for the /parts page
export async function getPartsPageData() {
  const [content, categories, featuredParts, brands, benefits] = await Promise.all([
    partsPageRepository.findContent(),
    partsPageRepository.findActiveCategories(),
    partsPageRepository.findFeaturedParts(),
    partsPageRepository.findActiveBrands(),
    partsPageRepository.findActiveBenefits(),
  ]);

  // Include a few non-featured parts so the catalog isn't empty.
  const extraParts = await partsPageRepository.findExtraParts(20);

  return {
    content,
    categories,
    parts: featuredParts.length > 0 ? featuredParts : extraParts,
    featuredParts,
    brands,
    benefits,
  };
}
