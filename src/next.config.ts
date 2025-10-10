
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

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
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true, // Garante que o novo Service Worker ative imediatamente
  // runtimeCaching, // Descomente para configurar estratégias de cache
  disable: process.env.NODE_ENV === 'development',
});

// A configuração env é necessária para o Next.js carregar as variáveis de ambiente
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parsed: localEnv } = require('dotenv').config();

const configWithEnv = {
    ...pwaConfig(nextConfig),
    env: {
        ...localEnv,
    },
};

export default configWithEnv;
