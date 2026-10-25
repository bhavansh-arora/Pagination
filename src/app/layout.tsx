import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/inter-tight";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sagely — your coaching mind, on call 24/7", template: "%s · Sagely" },
  description: "Coaches train an AI on their own content so clients can talk to their mind any time.",
};

export const viewport: Viewport = { themeColor: "#faf9fc", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} scroll-smooth`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
