import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Lora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Markdown to PDF Generator",
  description: "Professional markdown to PDF report generator with custom styling and brand identity.",
  icons: {
    icon: "/brand-logo.svg",
    apple: "/brand-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${lora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
