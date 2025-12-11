
'use client';

// This hook is now deprecated and its logic has been moved into auth-provider.tsx
// to avoid circular dependencies with dynamic imports.
// It is kept for backward compatibility but should be removed in a future refactor.

import { useAuth as useAuthProvider } from '@/components/auth-provider';

/**
 * @deprecated The logic has been moved to `auth-provider.tsx`. Import `useAuth` from there instead.
 */
export const useAuth = useAuthProvider;
