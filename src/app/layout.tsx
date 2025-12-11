
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import PwaUpdateAlert from '@/components/pwa-update-alert';
import { AuthProvider } from '@/components/auth-provider';
import ClientOnly from '@/components/client-only';
import ClientManifestInjector from '@/components/client-manifest';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Synergia OS',
  description: 'Sistema de Gestão Integrada',
  // manifest: '/manifest.json', // Removido para evitar problemas de CORS no Cloud Workstations
  icons: {
    icon: [
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn('font-sans', inter.variable)}>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <ClientOnly>
              <Toaster />
              <PwaUpdateAlert />
              <ClientManifestInjector />
            </ClientOnly>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
