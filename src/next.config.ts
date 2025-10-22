
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';
import pkg from './package.json' assert { type: 'json' };

const { version } = pkg;

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    // Use Vercel's git commit hash for versioning in production, fallback to package.json version
    APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA || version,
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true, // Garante que o novo Service Worker ative imediatamente
  disable: process.env.NODE_ENV === 'development',
});

// A Vercel já expõe as variáveis de ambiente do projeto, não precisamos injetá-las aqui durante o build.
export default pwaConfig(nextConfig);
