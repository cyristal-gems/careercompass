import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
const title = "JobTrackr | Your job search, in focus.";
const description =
  "A private job application tracking and analytics platform for managing opportunities, interviews, follow-ups, and job-search performance.";
const siteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "JobTrackr",
    type: "website",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/favicon.svg" },
  manifest: "/site.webmanifest",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
