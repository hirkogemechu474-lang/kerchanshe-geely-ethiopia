import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// Every document PDF (agreement, quotation, invoice, receipt, handover,
// brochure) goes out through here.
//
// A PDF opened straight in a browser tab can't carry a favicon or a <title>,
// so the tab showed the shared server's default icon and a raw URL. When the
// request is a desktop browser's top-level navigation (Sec-Fetch-Dest:
// document), we answer with a tiny HTML page instead — Geely tab icon, a real
// title — that shows the same PDF full-screen in an <iframe>. The iframe's own
// request arrives with Sec-Fetch-Dest: iframe and gets the raw PDF, as does
// everything else (fetch/XHR, email attachments, older browsers that don't
// send Sec-Fetch-Dest).
//
// Mobile browsers are deliberately excluded: Android Chrome can't render a PDF
// inside an iframe at all and iOS Safari only shows its first page, so on a
// phone the PDF is sent directly exactly as before.

// Tab icon, inlined as a data URI so it works whatever path/proxy the viewer
// page is reached through (/geely/api via the web app in production,
// localhost:4000/api directly from the admin app in dev).
let _iconDataUri: string | null | undefined;
function iconDataUri(): string | null {
  if (_iconDataUri === undefined) {
    _iconDataUri = null;
    const candidates = [
      path.resolve(process.cwd(), '..', 'apps', 'web', 'public', 'icons', 'icon-32x32.png'),
      path.resolve(process.cwd(), '..', 'apps', 'admin', 'public', 'icons', 'icon-32x32.png'),
    ];
    const iconPath = candidates.find((p) => fs.existsSync(p));
    if (iconPath) _iconDataUri = `data:image/png;base64,${fs.readFileSync(iconPath).toString('base64')}`;
  }
  return _iconDataUri;
}

const MOBILE_UA = /Mobi|Android|iPhone|iPad|iPod/i;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function sendPdf(
  req: Request,
  res: Response,
  data: Uint8Array | Buffer,
  opts: { filename: string; title: string },
): void {
  const wantsDownload = req.query.download === '1';
  const isTabNavigation = req.get('sec-fetch-dest') === 'document';
  const isMobile = MOBILE_UA.test(req.get('user-agent') || '');
  // Same URL, two different bodies — keep any cache from mixing them up.
  res.setHeader('Vary', 'Sec-Fetch-Dest, User-Agent');

  if (isTabNavigation && !wantsDownload && !isMobile) {
    // Relative to the current URL's own directory, so the /geely base path
    // (stripped by the web app's /api rewrite before it reaches us) is kept.
    const [pathname, query = ''] = req.originalUrl.split('?');
    const self = path.posix.basename(pathname) + (query ? `?${query}` : '');
    const downloadHref = self + (query ? '&' : '?') + 'download=1';
    const title = `${opts.title} | Geely Ethiopia`;
    const icon = iconDataUri();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
${icon ? `<link rel="icon" type="image/png" sizes="32x32" href="${icon}">` : ''}
<style>
  html,body{margin:0;height:100%;background:#525659;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  body{display:flex;flex-direction:column}
  header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px;background:#fff;border-bottom:1px solid #ddd}
  header h1{margin:0;font-size:15px;font-weight:600;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  header a{flex:none;font-size:14px;font-weight:600;color:#fff;background:#111;border-radius:6px;padding:7px 14px;text-decoration:none}
  iframe{flex:1;width:100%;border:0}
</style>
</head>
<body>
<header><h1>${escapeHtml(opts.title)}</h1><a href="${escapeHtml(downloadHref)}" download="${escapeHtml(opts.filename)}">Download PDF</a></header>
<iframe src="${escapeHtml(self)}" title="${escapeHtml(opts.title)}"></iframe>
</body>
</html>`);
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${wantsDownload ? 'attachment' : 'inline'}; filename="${opts.filename}"`);
  res.send(data);
}
