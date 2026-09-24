import type { Metadata } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/admin/ThemeProvider";
import { BASE_PATH, withBasePath } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Geely Ethiopia Admin",
  description: "Geely Ethiopia Admin Panel",
  icons: {
    // 16/32/48 are the emblem alone (the GEELY wordmark is illegible at
    // browser-tab size); 128px and up carry the full emblem + wordmark.
    icon: [
      { url: withBasePath('/icons/icon-16x16.png'), sizes: '16x16', type: 'image/png' },
      { url: withBasePath('/icons/icon-32x32.png'), sizes: '32x32', type: 'image/png' },
      { url: withBasePath('/icons/icon-48x48.png'), sizes: '48x48', type: 'image/png' },
      { url: withBasePath('/icons/icon-192x192.png'), sizes: '192x192', type: 'image/png' },
      { url: withBasePath('/icons/icon-512x512.png'), sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: withBasePath('/icons/icon-152x152.png'), sizes: '152x152', type: 'image/png' },
      { url: withBasePath('/icons/icon-180x180.png'), sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [withBasePath('/icons/icon-32x32.png')],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {BASE_PATH && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var b=${JSON.stringify(BASE_PATH)};var f=window.fetch;function u(x){return typeof x==='string'&&x.charAt(0)==='/'&&x.indexOf(b+'/')!==0&&x!==b?b+x:x;}window.fetch=function(i,n){return f.call(this,u(i),n)};})();`,
            }}
          />
        )}
        {/* Document/PDF download links (QuotationPdfPanel, OrderHandoverPanel,
            OrderFulfillmentPanel, OrderDetail, OrderApprovalPanel — quotation,
            handover, invoice, receipt, agreement PDFs) render plain
            <a href="/api/..."> — a click is a real navigation, not a fetch(),
            so the patch above never touched these. A bare "/api/..." href
            doesn't just 404: this vhost's "/api/" prefix is already claimed
            by a different backend (GMS) on this shared server, so clicking
            silently opened GMS's 404 page instead of the PDF. Patching
            setAttribute here catches every current AND future
            <a href="/..."> this app renders, the same way the fetch patch
            above does for fetch(). */}
        {BASE_PATH && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var b=${JSON.stringify(BASE_PATH)};function u(x){return typeof x==='string'&&x.charAt(0)==='/'&&x.indexOf(b+'/')!==0&&x!==b?b+x:x;}var origSetAttr=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){if(name==='href'&&this.tagName==='A'){value=u(value);}return origSetAttr.call(this,name,value);};})();`,
            }}
          />
        )}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="dark:bg-gray-950 transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
