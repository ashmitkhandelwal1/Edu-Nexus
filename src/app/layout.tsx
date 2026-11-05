import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDUNEXUS | AI-Powered School & Learning Management System",
  description:
    "An intelligent, enterprise-grade School Management and Learning Management System for modern education institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth antialiased">
      <body className="min-h-screen bg-white text-slate-900 font-sans">{children}</body>
    </html>
  );
}
