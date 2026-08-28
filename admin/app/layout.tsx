import type { Metadata } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/admin/ThemeProvider";
import { BASE_PATH } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Geely Ethiopia Admin",
  description: "Geely Ethiopia Admin Panel",
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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="dark:bg-gray-950 transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
