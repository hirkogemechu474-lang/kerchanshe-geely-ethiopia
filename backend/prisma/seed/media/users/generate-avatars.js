// One-off generator for the placeholder avatar SVGs in this folder — no
// upload endpoint exists yet, so seed users need self-contained files here.
// Run manually with `node generate-avatars.js` if the roster below changes;
// not invoked by the seed script itself.
const fs = require('fs');
const path = require('path');

const users = [
  { file: 'super-admin.svg', initials: 'SA', bg: '#1E3A8A' },
  { file: 'sales-manager.svg', initials: 'SM', bg: '#0F766E' },
  { file: 'sales-representative.svg', initials: 'SR', bg: '#B45309' },
  { file: 'workshop-manager.svg', initials: 'WM', bg: '#4338CA' },
  { file: 'service-advisor.svg', initials: 'SD', bg: '#BE123C' },
  { file: 'marketing.svg', initials: 'MK', bg: '#15803D' },
];

for (const u of users) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="64" fill="${u.bg}"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="48" fill="#FFFFFF" font-weight="600">${u.initials}</text>
</svg>`;
  fs.writeFileSync(path.join(__dirname, u.file), svg);
}
console.log('Generated', users.length, 'avatars');
