import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugamili - Anonymous Feedback & Meme App",
  description:
    "A vibrant, anonymous feedback & meme sharing platform built with Next.js, Firebase, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
