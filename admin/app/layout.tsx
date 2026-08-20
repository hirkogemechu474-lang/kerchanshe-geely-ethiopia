import type { Metadata } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/admin/ThemeProvider";

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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="dark:bg-gray-950 transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}