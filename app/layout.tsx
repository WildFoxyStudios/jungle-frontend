import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { ThemeProvider } from "@/lib/theme-context";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Red Social",
    default: "Red Social",
  },
  description: "La red social para conectar con amigos y familia.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    siteName: "Red Social",
    title: "Red Social",
    description: "La red social para conectar con amigos y familia.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <RealtimeProvider>
              <AppProviders>{children}</AppProviders>
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
