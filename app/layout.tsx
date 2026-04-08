import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIT-AP Events",
  description: "An automated, real-time board of upcoming hackathons, workshops, and coding challenges at VIT-AP University. Stay updated on technical and cultural events.",
  keywords: ["VIT-AP", "events", "hackathon", "workshop", "college", "university", "coding", "cultural", "OD", "vitap events"],
  authors: [{ name: "VIT-AP Students" }],
  openGraph: {
    title: "VIT-AP Events Board",
    description: "Discover the latest hackathons, workshops, and campus activities at VIT-AP.",
    url: "https://events.pranjalk.tech",
    siteName: "VIT-AP Events",
    images: [
      {
        url: "https://events.pranjalk.tech/favicon.ico",
        width: 256, 
        height: 256,
        alt: "VIT-AP Events Favicon",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "VIT-AP Events | Stay Updated",
    description: "Your automated board for every upcoming campus event at VIT-AP.",
    images: ["https://events.pranjalk.tech/favicon.ico"],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics/>
        {children}
      </body>
    </html>
  );
}
