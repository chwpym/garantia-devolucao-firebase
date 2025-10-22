
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

const { version } = require('./package.json');

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


// A configuração env é necessária para o Next.js carregar as variáveis de ambiente
// A Vercel já expõe as variáveis de ambiente do projeto, não precisamos injetá-las aqui durante o build.
// Manter o 'dotenv' é útil apenas para o ambiente de desenvolvimento local.
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}


export default pwaConfig(nextConfig);
