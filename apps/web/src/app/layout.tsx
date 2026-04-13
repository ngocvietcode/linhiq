import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#080C14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "LinhIQ — Study Smarter, Not Harder",
    template: "%s | LinhIQ",
  },
  description:
    "Your personal AI tutor for International & Vietnamese programs. Answers your questions with questions — until you truly understand.",
  keywords: ["AI tutor", "international programs", "Vietnamese programs", "Socratic method", "e-learning", "LinhIQ"],
  authors: [{ name: "LinhIQ" }],
  openGraph: {
    title: "LinhIQ — Study Smarter, Not Harder",
    description: "Your personal AI tutor for International & Vietnamese programs.",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          background: "var(--color-base)",
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-elevated)",
              color: "var(--color-text-primary)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-default)",
              fontSize: "14px",
              boxShadow: "var(--shadow-md)",
            },
          }}
        />
      </body>
    </html>
  );
}
