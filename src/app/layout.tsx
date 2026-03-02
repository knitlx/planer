import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QuantumSidebar } from "@/components/QuantumSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Focus Flow",
  description: "Персональная система продуктивности",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QuantumSidebar />
          <main className="md:pl-64 min-h-screen">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
