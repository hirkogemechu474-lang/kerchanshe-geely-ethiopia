// One-time/rerunnable maintenance script: registers pre-existing
// images/videos as MediaAsset rows so they show up in the admin's Media
// Library (previously the library only ever got populated by uploads made
// through MediaBrowser.tsx — every other upload path just wrote a bare URL
// onto its own record, so browsing the library showed "No Media Found"
// despite plenty of media existing across the site).
//
// Not wired into dev/start/seed — run manually with `npm run db:backfill-media`.
//
// Two passes:
//   1. Scan known URL-bearing fields across the DB and register each URL.
//   2. Walk apps/admin/public/uploads/ for files not covered by pass 1
//      (excluding private-upload folders), and register those too.
// Both passes dedupe against URLs already present in MediaAsset, so
// re-running after new manual uploads or new backfill-eligible fields is
// safe and only adds what's missing.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient();

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const UPLOAD_ROOT = path.join(REPO_ROOT, 'apps', 'admin', 'public', 'uploads');

// Private, single-purpose attachments — never surfaced in the shared
// browsable Media Library (matches the upload `category` each private
// uploader already passes to /api/upload).
const PRIVATE_UPLOAD_FOLDERS = new Set(['quote-id', 'sales-agreement', 'warranty-claims', 'test-drive-id', 'test']);

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};
const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
};

interface PendingAsset {
  url: string;
  category: string;
}

function classify(url: string): { fileType: 'image' | 'video'; mimeType: string } | null {
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  if (IMAGE_MIME_TYPES[ext]) return { fileType: 'image', mimeType: IMAGE_MIME_TYPES[ext] };
  if (VIDEO_MIME_TYPES[ext]) return { fileType: 'video', mimeType: VIDEO_MIME_TYPES[ext] };
  return null; // PDFs, .glb/.gltf, or unrecognized — not library media, skip.
}

function collect(pending: Map<string, PendingAsset>, url: unknown, category: string) {
  if (typeof url !== 'string') return;
  const trimmed = url.trim();
  if (!trimmed) return;
  if (!trimmed.startsWith('/uploads/') && !/^https?:\/\//i.test(trimmed)) return;
  if (!pending.has(trimmed)) pending.set(trimmed, { url: trimmed, category });
}

function collectArray(pending: Map<string, PendingAsset>, value: unknown, category: string, field?: string) {
  if (!Array.isArray(value)) return;
  for (const entry of value) {
    if (typeof entry === 'string') {
      collect(pending, entry, category);
    } else if (entry && typeof entry === 'object' && field && field in (entry as Record<string, unknown>)) {
      collect(pending, (entry as Record<string, unknown>)[field], category);
    }
  }
}

async function collectReferencedUrls(): Promise<Map<string, PendingAsset>> {
  const pending = new Map<string, PendingAsset>();

  const vehicles = await prisma.vehicle.findMany({ select: { images: true, heroImageUrl: true, heroVideoUrl: true } });
  for (const v of vehicles) {
    collectArray(pending, v.images, 'vehicle');
    collect(pending, v.heroImageUrl, 'vehicle');
    collect(pending, v.heroVideoUrl, 'vehicle');
  }

  const colors = await prisma.vehicleColor.findMany({ select: { imageUrl: true, images: true } });
  for (const c of colors) {
    collect(pending, c.imageUrl, 'vehicle');
    collectArray(pending, c.images, 'vehicle');
  }

  const interiors = await prisma.vehicleInterior.findMany({ select: { imageUrl: true, images: true } });
  for (const i of interiors) {
    collect(pending, i.imageUrl, 'vehicle');
    collectArray(pending, i.images, 'vehicle');
  }

  const wheels = await prisma.vehicleWheel.findMany({ select: { imageUrl: true, images: true } });
  for (const w of wheels) {
    collect(pending, w.imageUrl, 'vehicle');
    collectArray(pending, w.images, 'vehicle');
  }

  const accessories = await prisma.vehicleAccessory.findMany({ select: { imageUrl: true, images: true } });
  for (const a of accessories) {
    collect(pending, a.imageUrl, 'vehicle');
    collectArray(pending, a.images, 'vehicle');
  }

  const vehicleCategories = await prisma.vehicleCategory.findMany({
    select: { imageUrl: true, iconUrl: true, heroImageUrl: true, heroVideoUrl: true },
  });
  for (const c of vehicleCategories) {
    collect(pending, c.imageUrl, 'category');
    collect(pending, c.iconUrl, 'category');
    collect(pending, c.heroImageUrl, 'category');
    collect(pending, c.heroVideoUrl, 'category');
  }

  const showcases = await prisma.vehicleShowcase.findMany({ select: { views: true, videoUrl: true } });
  for (const s of showcases) {
    collectArray(pending, s.views, 'vehicle-360', 'imageUrl');
    collect(pending, s.videoUrl, 'vehicle-360');
    // brochureUrl / modelUrl deliberately skipped — PDFs and 3D models
    // aren't image/video media the library (MediaAsset.fileType) models.
  }

  const dealers = await prisma.dealer.findMany({ select: { logo: true, gallery: true } });
  for (const d of dealers) {
    collect(pending, d.logo, 'dealer');
    collectArray(pending, d.gallery, 'dealer');
  }

  const partsContent = await prisma.partsPageContent.findMany({
    select: { heroBannerImage: true, heroBackgroundImage: true },
  });
  for (const p of partsContent) {
    collect(pending, p.heroBannerImage, 'parts');
    collect(pending, p.heroBackgroundImage, 'parts');
  }

  const partCategories = await prisma.partCategory.findMany({ select: { imageUrl: true } });
  for (const p of partCategories) collect(pending, p.imageUrl, 'parts');

  const partBrands = await prisma.partBrand.findMany({ select: { imageUrl: true } });
  for (const p of partBrands) collect(pending, p.imageUrl, 'parts');

  const spareParts = await prisma.sparePart.findMany({ select: { imageUrl: true } });
  for (const p of spareParts) collect(pending, p.imageUrl, 'parts');

  const promotions = await prisma.promotion.findMany({ select: { bannerImage: true } });
  for (const p of promotions) collect(pending, p.bannerImage, 'promotions');

  const news = await prisma.newsArticle.findMany({ select: { imageUrl: true } });
  for (const n of news) collect(pending, n.imageUrl, 'news');

  const heroSections = await prisma.heroSection.findMany({
    select: { imageUrl: true, videoUrl: true, posterUrl: true },
  });
  for (const h of heroSections) {
    collect(pending, h.imageUrl, 'hero');
    collect(pending, h.videoUrl, 'hero');
    collect(pending, h.posterUrl, 'hero');
  }

  return pending;
}

function walkUploadsDir(dir: string, relative: string, onFile: (relativePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const entryAbsolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const topFolder = entryRelative.split('/')[0];
      if (PRIVATE_UPLOAD_FOLDERS.has(topFolder)) continue;
      walkUploadsDir(entryAbsolute, entryRelative, onFile);
    } else if (entry.isFile()) {
      onFile(entryRelative);
    }
  }
}

function resolveDiskPath(url: string): string | null {
  if (!url.startsWith('/uploads/')) return null;
  // URLs coming from JSON fields are sometimes stored already
  // percent-encoded (e.g. spaces in seeded folder names) — decode before
  // joining, since the filesystem entries themselves have literal spaces.
  return path.join(UPLOAD_ROOT, decodeURIComponent(url.slice('/uploads/'.length)));
}

async function main() {
  const existing = await prisma.mediaAsset.findMany({ select: { url: true } });
  const knownUrls = new Set(existing.map((row) => row.url));

  const pending = await collectReferencedUrls();

  let referencedFound = pending.size;
  let created = 0;
  let alreadyTracked = 0;
  let unsupportedType = 0;
  let missingOnDisk = 0;

  for (const { url, category } of pending.values()) {
    if (knownUrls.has(url)) {
      alreadyTracked += 1;
      continue;
    }
    const kind = classify(url);
    if (!kind) {
      unsupportedType += 1;
      continue;
    }

    const diskPath = resolveDiskPath(url);
    const existsOnDisk = diskPath ? fs.existsSync(diskPath) : true; // can't verify absolute https:// URLs — assume valid
    if (!existsOnDisk) {
      // The DB field points at a file that was never actually written to
      // disk (stale/fabricated demo data) — don't register broken media.
      missingOnDisk += 1;
      continue;
    }
    const fileSize = diskPath ? fs.statSync(diskPath).size : 0;

    const fileName = url.split('/').pop() || url;

    await prisma.mediaAsset.create({
      data: {
        fileName,
        originalName: fileName,
        fileType: kind.fileType,
        mimeType: kind.mimeType,
        fileSize,
        url,
        category,
        isPublic: true,
      },
    });
    knownUrls.add(url);
    created += 1;
  }

  // Pass 2: orphan files on disk that no DB field pointed to.
  let orphansRegistered = 0;
  const orphanEntries: { relativePath: string }[] = [];
  walkUploadsDir(UPLOAD_ROOT, '', (relativePath) => orphanEntries.push({ relativePath }));

  for (const { relativePath } of orphanEntries) {
    // Percent-encode each segment so a file whose on-disk path has spaces
    // (only the legacy prisma/seed/media fixtures do) produces the same URL
    // shape pass 1 would already know about, instead of a second row for
    // the same physical file under an unencoded alias.
    const url = `/uploads/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
    if (knownUrls.has(url)) continue;
    const kind = classify(url);
    if (!kind) continue;

    const category = relativePath.includes('/') ? relativePath.split('/')[0] : 'uncategorized';
    const diskPath = path.join(UPLOAD_ROOT, relativePath);
    const fileSize = fs.existsSync(diskPath) ? fs.statSync(diskPath).size : 0;
    const fileName = relativePath.split('/').pop() || relativePath;

    await prisma.mediaAsset.create({
      data: {
        fileName,
        originalName: fileName,
        fileType: kind.fileType,
        mimeType: kind.mimeType,
        fileSize,
        url,
        category,
        isPublic: true,
      },
    });
    knownUrls.add(url);
    orphansRegistered += 1;
  }

  console.log('--- Media Library backfill summary ---');
  console.log(`Referenced URLs found:        ${referencedFound}`);
  console.log(`Newly created (referenced):   ${created}`);
  console.log(`Already tracked (skipped):    ${alreadyTracked}`);
  console.log(`Unsupported type (skipped):   ${unsupportedType}`);
  console.log(`Referenced but file missing (skipped): ${missingOnDisk}`);
  console.log(`Orphan disk files registered: ${orphansRegistered}`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
