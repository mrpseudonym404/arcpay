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
  title: "ArcPay - USDC Payment Requests",
  description: "Create, share, and pay USDC invoices instantly on Arc Testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="talentapp:project_verification" content="a78d87ff3c59f2443ce41c96af99f5680a77d20711942b4439086f5d8e2b080a4cc58939bfc72fcc6b815eee80c7ff14acda29cfafee372ec58de8bdbc21a6d6" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
