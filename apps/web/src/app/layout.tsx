import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinhIQ — Ask Linh. Learn Smarter.",
  description:
    "Your personalized AI tutor for Cambridge IGCSE, A-Level, and Vietnamese High School Curriculum. Powered by Socratic guidance.",
  icons: {
    icon: "/favicon.ico",
  },
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
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200 ease-in-out">
        {/* We can wrap with SessionProvider from NextAuth later here */}
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
            },
          }} 
        />
      </body>
    </html>
  );
}
