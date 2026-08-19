import type { Metadata } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}