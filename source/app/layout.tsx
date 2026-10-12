import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { DM_Sans } from "next/font/google";

import { PRODUCT_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PRODUCT_NAME} — Affiliate & Commission Prototype`,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: SITE_DESCRIPTION,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0F1419",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(dmSans.variable, GeistMono.variable)}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
