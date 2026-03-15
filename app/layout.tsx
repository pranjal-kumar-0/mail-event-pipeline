import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "VIT-AP Events | Campus Hackathons & Workshops",
  description: "An automated, real-time board of upcoming hackathons, workshops, and coding challenges at VIT-AP University. Stay updated on technical and cultural events.",
  keywords: ["VIT-AP", "events", "hackathon", "workshop", "college", "university", "coding", "cultural", "OD", "vitap events"],
  authors: [{ name: "VIT-AP Students" }],
  openGraph: {
    title: "VIT-AP Events Board",
    description: "Discover the latest hackathons, workshops, and campus activities at VIT-AP.",
    url: "https://events.pranjalk.tech",
    siteName: "VIT-AP Events",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIT-AP Events | Stay Updated",
    description: "Your automated board for every upcoming campus event at VIT-AP.",
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
        {children}
      </body>
    </html>
  );
}
