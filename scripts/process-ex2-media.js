// One-off media processing pass for the Geely EX2 asset import.
// Walks the extracted source folders and produces a web-ready mirror:
//   - images: downscaled to a 2000px long edge, re-encoded as quality-82 JPEG
//   - videos: transcoded per the category rules below
// Run with: node scripts/process-ex2-media.js
// Requires ffmpeg on PATH (see scripts/ffmpeg-path.js).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ffmpegPath } = require('./ffmpeg-path');

const SRC_ROOT = 'D:\\GEELY_DOC_3';
const OUT_ROOT = 'D:\\GEELY_DOC_3\\processed';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png']);
const IMAGE_SOURCES = [
  'extracted_LHD\\1. Exterior',
  'extracted_LHD\\2. Interior',
  'extracted_LHD\\3. 360° images',
  'extracted_LHD\\4. Lifestyle images',
  'extracted_LHD\\5-CG',
  'extracted_lifestyle_global',
  'extracted_cgtech\\03- CG TECH VIDEO&IMAGES\\03-CG TECH IMAGES',
  'extracted_cgtech\\03- CG TECH VIDEO&IMAGES\\2-CG Photos-from video',
  'extracted_social',
];

// [relative source video path fragment, output subfolder, ffmpeg args template]
const VIDEO_JOBS = [
  {
    // Hero loop: short, silent, small.
    src: 'extracted_videos\\02-PRODUCT VIDEOS\\1-Left Hand Drive Video\\00-TVC\\16_9 SIZE\\左舵_GEELY EX2_TVC_16比9.mp4',
    out: 'videos\\hero-tvc.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-t', '20',
      '-vf', "scale='min(1280,iw)':-2",
      '-an',
      '-c:v', 'libx264', '-crf', '27', '-preset', 'medium',
      '-movflags', '+faststart',
      outFile,
    ],
  },
  {
    // Design video -> Exterior gallery
    src: 'extracted_videos\\02-PRODUCT VIDEOS\\1-Left Hand Drive Video\\03-Design 设计篇\\1-With Subtitle有字幕\\16_9 SIZE\\左舵_GEELY EX2_设计篇_带字幕版_16比9.mp4',
    out: 'videos\\exterior-design.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outFile,
    ],
  },
  {
    // Space video -> Interior gallery
    src: 'extracted_videos\\02-PRODUCT VIDEOS\\1-Left Hand Drive Video\\01-Space 空间篇\\1. With Subtitle有字幕\\16_9 SIZE\\左舵_GEELY EX2_空间篇_带字幕版_16比9.mp4',
    out: 'videos\\interior-space.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outFile,
    ],
  },
  {
    // Handling video -> VehicleShowcase.videoUrl
    src: 'extracted_videos\\02-PRODUCT VIDEOS\\1-Left Hand Drive Video\\02-Handling灵动篇\\1-With Subtitle有字幕\\16_9 SIZE\\左舵_GEELY EX2_灵动篇_带字幕版_16比9.mp4',
    out: 'videos\\showcase-handling.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outFile,
    ],
  },
  {
    // EV explainer -> Technology gallery
    src: 'extracted_videos\\02-PRODUCT VIDEOS\\1-Left Hand Drive Video\\04-EV 新能源篇\\1-With Subtitle有字幕\\16_9 SIZE\\左舵_GEELY EX2_新能源篇_带字幕版_16比9.mp4',
    out: 'videos\\technology-ev.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outFile,
    ],
  },
  {
    // Safety CG explanation video -> Safety gallery
    src: 'extracted_cgtech\\03- CG TECH VIDEO&IMAGES\\1-CG TECH VIDEO\\1. With Subtitle有字幕\\Safety - Technical explanation video with subtitles .mov',
    out: 'videos\\safety-explainer.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outFile,
    ],
  },
  {
    // Driving Dynamics CG explanation video -> Technology gallery
    src: 'extracted_cgtech\\03- CG TECH VIDEO&IMAGES\\1-CG TECH VIDEO\\1. With Subtitle有字幕\\Driving Dynamics - Technical explanation video with subtitlesmov.mp4',
    out: 'videos\\technology-driving-dynamics.mp4',
    args: (inFile, outFile) => [
      '-y', '-i', inFile,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outFile,
    ],
  },
];

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) { console.warn('MISSING SOURCE DIR:', dir); return; }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

// Several source images (the whole 360° spin-frame set, some color cover
// shots) are RGBA PNGs with real transparency despite living in folders
// named "jpg" — encoding straight to JPEG (no alpha channel) silently
// flattened transparent pixels to black. Composite onto white instead; for
// already-opaque JPEGs this filter is a no-op (fully-opaque alpha everywhere).
const WHITE_COMPOSITE_FILTER =
  "[0:v]scale='min(2000,iw)':'min(2000,ih)':force_original_aspect_ratio=decrease,format=rgba[fg];" +
  'color=white,format=rgba[bgsrc];[bgsrc][fg]scale2ref[bg][fg2];[bg][fg2]overlay=shortest=1:format=auto,format=yuv420p';

function processImage(srcFile, outFile) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  if (fs.existsSync(outFile)) return; // resumable
  const args = [
    '-y', '-i', srcFile,
    '-filter_complex', WHITE_COMPOSITE_FILTER,
    '-frames:v', '1',
    '-q:v', '4', // ~quality 82-ish for mjpeg encoder
    outFile,
  ];
  try {
    execFileSync(ffmpegPath(), args, { stdio: 'pipe' });
  } catch (err) {
    console.error('IMAGE FAILED:', srcFile, err.message);
  }
}

function processVideo(job) {
  const inFile = path.join(SRC_ROOT, job.src);
  const outFile = path.join(OUT_ROOT, job.out);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  if (fs.existsSync(outFile)) { console.log('SKIP (exists):', job.out); return; }
  if (!fs.existsSync(inFile)) { console.warn('MISSING VIDEO SOURCE:', inFile); return; }
  console.log('Transcoding:', job.out);
  execFileSync(ffmpegPath(), job.args(inFile, outFile), { stdio: 'inherit' });
}

function main() {
  let imgCount = 0;
  for (const rel of IMAGE_SOURCES) {
    const srcDir = path.join(SRC_ROOT, rel);
    walk(srcDir, (file) => {
      // path.extname() treats a filename that's *only* an extension (e.g. a
      // literal ".jpg" with no basename, which this Google-Drive export has
      // a few of) as having no extension at all — match on the raw string instead.
      if (!/\.(jpe?g|png)$/i.test(file)) return;
      const relFromSrcRoot = path.relative(SRC_ROOT, file);
      // Always output .jpg regardless of source extension (re-encoding anyway).
      const outFile = path.join(OUT_ROOT, relFromSrcRoot).replace(/\.(jpg|jpeg|png)$/i, '.jpg');
      processImage(file, outFile);
      imgCount++;
      if (imgCount % 25 === 0) console.log(`...${imgCount} images processed`);
    });
  }
  console.log(`Done with images: ${imgCount} total.`);

  for (const job of VIDEO_JOBS) {
    processVideo(job);
  }
  console.log('Done with videos.');
}

main();
