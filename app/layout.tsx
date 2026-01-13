import type { Metadata } from "next";
import { Hanken_Grotesk, Quicksand } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import "@/styles/globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SkyVault - Secure Cloud Storage",
  description: "Organize and manage your files with SkyVault. Secure cloud storage for your images and documents, powered by ImageKit.",
  keywords: ["cloud storage", "file management", "secure storage", "image storage"],
  authors: [{ name: "SkyVault Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://skyvault-ecru.vercel.app",
    title: "SkyVault - Secure Cloud Storage",
    description: "Organize and manage your files with SkyVault. Secure cloud storage for your images and documents.",
    siteName: "SkyVault",
    images: [
      {
        url: "https://skyvault-ecru.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "SkyVault - Cloud Storage Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyVault - Secure Cloud Storage",
    description: "Organize and manage your files with SkyVault.",
    images: ["https://skyvault-ecru.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${hankenGrotesk.variable} ${quicksand.variable} antialiased bg-background text-foreground`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}