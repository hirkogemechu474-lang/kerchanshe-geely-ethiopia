// One-off media processing pass for the Geely EX5 asset import — mirrors
// process-ex2-media.js exactly (see that file for the white-background-
// composite rationale). Source tree here is already free of the "jpg
// folder is actually transparent PNG" surprise from the EX2 drop (this
// drop's "jpg"/"JPG" folders are genuine opaque JPEGs, verified before
// running this), but the composite filter is kept as a cheap safety net.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ffmpegPath } = require('./ffmpeg-path');

const SRC_ROOT = 'D:\\GEELY_ex5\\extracted';
const OUT_ROOT = 'D:\\GEELY_ex5\\processed';

const IMAGE_EXT_RE = /\.(jpe?g|png)$/i;

const WHITE_COMPOSITE_FILTER =
  "[0:v]scale='min(2000,iw)':'min(2000,ih)':force_original_aspect_ratio=decrease,format=rgba[fg];" +
  'color=white,format=rgba[bgsrc];[bgsrc][fg]scale2ref[bg][fg2];[bg][fg2]overlay=shortest=1:format=auto,format=yuv420p';

const VIDEO_JOBS = [
  {
    src: '3. Feature Related Assets\\256-color dynamic ambient lighting\\256-color dynamic ambient lighting.mp4',
    out: 'videos\\ambient-lighting.mp4',
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
    src: '3. Feature Related Assets\\16-speaker FlymeSound\\FlymeSound16-speaker.mp4',
    out: 'videos\\flyme-sound.mp4',
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

function processImage(srcFile, outFile) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  if (fs.existsSync(outFile)) return;
  const args = [
    '-y', '-i', srcFile,
    '-filter_complex', WHITE_COMPOSITE_FILTER,
    '-frames:v', '1',
    '-q:v', '4',
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
  walk(SRC_ROOT, (file) => {
    if (!IMAGE_EXT_RE.test(file)) return;
    const relFromSrcRoot = path.relative(SRC_ROOT, file);
    const outFile = path.join(OUT_ROOT, relFromSrcRoot).replace(IMAGE_EXT_RE, '.jpg');
    processImage(file, outFile);
    imgCount++;
    if (imgCount % 50 === 0) console.log(`...${imgCount} images processed`);
  });
  console.log(`Done with images: ${imgCount} total.`);

  for (const job of VIDEO_JOBS) {
    processVideo(job);
  }
  console.log('Done with videos.');
}

main();
