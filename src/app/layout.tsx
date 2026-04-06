import type { Metadata } from "next";
import { Geologica, JetBrains_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QuantumSidebar } from "@/components/QuantumSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteUrl } from "@/lib/site-url";

const geologica = Geologica({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geologica",
});

const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-unbounded",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

const description = "Персональная система продуктивности: проекты, задачи, фокус и идеи.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Focus Flow",
    template: "%s — Focus Flow",
  },
  description,
  applicationName: "Focus Flow",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Focus Flow",
    title: "Focus Flow",
    description,
    url: "/",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focus Flow",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geologica.variable} ${unbounded.variable} ${jetBrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="quantum-bg" aria-hidden />
          <QuantumSidebar />
          <main className="lg:pl-64 min-h-screen pt-16 lg:pt-0">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
