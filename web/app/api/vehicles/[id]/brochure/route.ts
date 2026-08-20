import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vehicles/[id]/brochure
 *
 * Generates a print-ready HTML brochure for the vehicle that the browser
 * can print to PDF. Served with Content-Disposition: attachment so clicking
 * "Download Brochure" opens the browser print dialog automatically.
 *
 * Zero external dependencies — pure HTML + CSS.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Find vehicle by slug or ID
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      OR: [{ slug: id }, { id }],
      isActive: true,
      status: 'published',
    },
    include: { brand: true, vehicleCategory: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }

  const specs = (vehicle.specifications || {}) as any;
  const imageList: string[] = Array.isArray(vehicle.images)
    ? vehicle.images.filter((image): image is string => typeof image === 'string')
    : [];
  const heroImage = vehicle.heroImageUrl || imageList[0] || '';

  // ── Build spec rows ────────────────────────────────────────────────────────
  const specRows: { label: string; value: string }[] = [
    { label: 'Brand',          value: vehicle.brand?.name || 'Geely' },
    { label: 'Category',       value: vehicle.vehicleCategory?.name || vehicle.category },
    { label: 'Model Year',     value: String(vehicle.year) },
    { label: 'Pricing',        value: 'Available on request' },
    ...[
      ['Engine',        specs?.engine?.type || specs?.engine],
      ['Power',         specs?.engine?.power || specs?.power],
      ['Transmission',  specs?.engine?.transmission || specs?.transmission],
      ['Fuel Type',     specs?.engine?.fuelType || specs?.fuelType],
      ['Drivetrain',    specs?.engine?.drivetrain || specs?.drivetrain],
      ['Range (EV)',    specs?.engine?.range || specs?.range],
      ['Battery',       specs?.engine?.batteryCapacity || specs?.batteryCapacity],
      ['Length',        specs?.dimensions?.length],
      ['Width',         specs?.dimensions?.width],
      ['Height',        specs?.dimensions?.height],
      ['Wheelbase',     specs?.dimensions?.wheelbase],
      ['Ground Clearance', specs?.dimensions?.groundClearance],
      ['Seating',       specs?.dimensions?.seatingCapacity || specs?.seating],
    ]
      .filter(([, v]) => Boolean(v))
      .map(([label, value]) => ({ label: label as string, value: value as string })),
  ];

  // ── Build features list ────────────────────────────────────────────────────
  const features: string[] = specs?.features
    ? Object.values(specs.features)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter(Boolean)
        .map(String)
    : [];

  // ── Generate HTML ──────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${vehicle.name} Brochure — Geely Ethiopia</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #1a2744;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Cover page ─────────────────────────────────────── */
    .cover {
      position: relative;
      height: 100vh;
      min-height: 600px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow: hidden;
      page-break-after: always;
      background: linear-gradient(135deg, #0b2545 0%, #1a4a8a 60%, #0057b8 100%);
    }

    .cover-hero {
      position: absolute;
      inset: 0;
      object-fit: cover;
      width: 100%;
      height: 100%;
      opacity: 0.45;
    }

    .cover-overlay {
      position: relative;
      z-index: 2;
      padding: 48px;
      background: linear-gradient(to top, rgba(11,37,69,0.95) 0%, transparent 100%);
    }

    .cover-brand {
      font-size: 11px;
      letter-spacing: 0.25em;
      font-weight: 700;
      color: #c9a227;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .cover-name {
      font-size: 64px;
      font-weight: 900;
      color: #fff;
      line-height: 1.05;
      margin-bottom: 12px;
    }

    .cover-desc {
      font-size: 16px;
      color: rgba(255,255,255,0.75);
      max-width: 480px;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .cover-price {
      display: inline-block;
      background: #c9a227;
      color: #2c2308;
      font-weight: 700;
      font-size: 20px;
      padding: 10px 24px;
      border-radius: 6px;
      margin-bottom: 32px;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 16px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }

    .geely-logo {
      font-size: 22px;
      font-weight: 900;
      color: #fff;
      letter-spacing: 0.06em;
    }

    /* ── Content pages ───────────────────────────────────── */
    .page {
      padding: 48px;
      page-break-after: always;
    }

    .page:last-child { page-break-after: auto; }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c9a227;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 32px;
      font-weight: 800;
      color: #0b2545;
      margin-bottom: 24px;
    }

    /* ── Specs table ─────────────────────────────────────── */
    .specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .spec-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e8edf5;
      gap: 16px;
    }

    .spec-label { color: #6b7fa8; font-size: 13px; }
    .spec-value { font-weight: 600; font-size: 13px; color: #0b2545; text-align: right; }

    /* ── Features grid ───────────────────────────────────── */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      background: #f4f7fc;
      border-radius: 6px;
      font-size: 12px;
      color: #1a2744;
    }

    .feature-check {
      color: #0057b8;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ── Gallery grid ────────────────────────────────────── */
    .gallery-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-template-rows: auto auto;
      gap: 12px;
    }

    .gallery-hero { grid-row: span 2; }

    .gallery-img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: 8px;
    }

    .gallery-hero .gallery-img { height: 452px; }

    /* ── Contact strip ───────────────────────────────────── */
    .contact-strip {
      background: #0b2545;
      color: #fff;
      padding: 32px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .contact-cta-label {
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #c9a227;
      margin-bottom: 4px;
    }

    .contact-cta-title {
      font-size: 24px;
      font-weight: 800;
    }

    .contact-actions { display: flex; gap: 12px; flex-wrap: wrap; }

    .btn-gold {
      background: #c9a227;
      color: #2c2308;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 22px;
      border-radius: 6px;
      text-decoration: none;
    }

    .btn-outline {
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      font-size: 13px;
      padding: 10px 22px;
      border-radius: 6px;
      text-decoration: none;
    }

    .disclaimer {
      font-size: 10px;
      color: #9aadcc;
      padding: 12px 48px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    @media print {
      @page { margin: 0; size: A4 portrait; }
      .cover { height: 100vh; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

<!-- ── COVER PAGE ─────────────────────────────────────────────────────── -->
<div class="cover">
  ${heroImage ? `<img class="cover-hero" src="${heroImage}" alt="${vehicle.name}" />` : ''}
  <div class="cover-overlay">
    <div class="cover-brand">${vehicle.brand?.name || 'Geely'} · ${vehicle.vehicleCategory?.name || vehicle.category}</div>
    <h1 class="cover-name">${vehicle.name}</h1>
    ${vehicle.description ? `<p class="cover-desc">${vehicle.description}</p>` : ''}
    <div class="cover-price">Pricing available on request</div>
    <div class="cover-footer">
      <div class="geely-logo">GEELY</div>
      <div>Official Distributor: Kerchanshe Auto · geelyethiopia.com</div>
    </div>
  </div>
</div>

<!-- ── SPECIFICATIONS ────────────────────────────────────────────────── -->
<div class="page">
  <div class="section-label">Technical Data</div>
  <h2 class="section-title">Specifications</h2>
  <div class="specs-grid">
    ${specRows.map(({ label, value }) => `
      <div class="spec-row">
        <span class="spec-label">${label}</span>
        <span class="spec-value">${value}</span>
      </div>
    `).join('')}
  </div>
</div>

${features.length > 0 ? `
<!-- ── FEATURES ──────────────────────────────────────────────────────── -->
<div class="page">
  <div class="section-label">Highlights</div>
  <h2 class="section-title">Key Features</h2>
  <div class="features-grid">
    ${features.slice(0, 20).map((f) => `
      <div class="feature-item">
        <span class="feature-check">✓</span>
        <span>${f}</span>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

${imageList.length > 1 ? `
<!-- ── GALLERY ───────────────────────────────────────────────────────── -->
<div class="page">
  <div class="section-label">Photography</div>
  <h2 class="section-title">Gallery</h2>
  <div class="gallery-grid">
    ${imageList.slice(0, 3).map((img: string, i: number) => `
      <div class="${i === 0 ? 'gallery-hero' : ''}">
        <img class="gallery-img" src="${img}" alt="${vehicle.name} view ${i + 1}" />
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<!-- ── CONTACT CTA ───────────────────────────────────────────────────── -->
<div class="contact-strip">
  <div>
    <div class="contact-cta-label">Own Your ${vehicle.name}</div>
    <div class="contact-cta-title">Book a Test Drive Today</div>
  </div>
  <div class="contact-actions">
    <a class="btn-gold" href="https://geelyethiopia.com/test-drive?model=${vehicle.slug}">Book Test Drive</a>
    <a class="btn-outline" href="https://geelyethiopia.com/quote?model=${vehicle.slug}">Get a Quote</a>
  </div>
</div>
<div class="disclaimer" style="background:#0b2545;">
  Prices, specifications, and features are subject to change without notice. Images for illustration purposes only.
  © ${new Date().getFullYear()} Geely Ethiopia — Kerchanshe Auto. All rights reserved.
</div>

<script>
  window.addEventListener('load', () => setTimeout(() => window.print(), 600));
</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${vehicle.slug}-brochure.html"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
