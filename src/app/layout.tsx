import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavigationWrapper from "@/components/navbar/NavbarWrapper";
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
  title: "Sophia",
  description: "Transform your office hours with AI-driven insights and automation",
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
        <NavigationWrapper />
        <main>{children}</main>
      </body>
    </html>
  );
}