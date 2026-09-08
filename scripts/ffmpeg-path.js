// Resolves the portable ffmpeg build downloaded to ~/tools/ffmpeg (no admin
// rights available on this machine to install it via Chocolatey/winget).
const fs = require('fs');
const path = require('path');
const os = require('os');

function ffmpegPath() {
  const root = path.join(os.homedir(), 'tools', 'ffmpeg');
  if (!fs.existsSync(root)) {
    throw new Error(`ffmpeg not found at ${root} — extract ffmpeg.zip there first.`);
  }
  const versionDir = fs.readdirSync(root).find((d) => d.startsWith('ffmpeg-'));
  if (!versionDir) throw new Error(`No ffmpeg-* folder inside ${root}`);
  const exe = path.join(root, versionDir, 'bin', 'ffmpeg.exe');
  if (!fs.existsSync(exe)) throw new Error(`ffmpeg.exe not found at ${exe}`);
  return exe;
}

module.exports = { ffmpegPath };
