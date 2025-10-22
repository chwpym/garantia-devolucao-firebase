
import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

// Correção: Usando 'import' para ler o JSON
import packageJson from './package.json';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Cuidado: Ignorar erros de build pode esconder problemas.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Cuidado: Ignorar o lint durante o build pode permitir que código de baixa qualidade chegue à produção.
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
    APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA || packageJson.version,
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
} );

// A Vercel já expõe as variáveis de ambiente do projeto, não precisamos injetá-las aqui durante o build.
export default pwaConfig(nextConfig);
