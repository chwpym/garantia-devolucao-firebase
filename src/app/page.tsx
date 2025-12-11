
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is a temporary redirect component.
// Since the main logic is now inside (protected),
// the root page should redirect there.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // or a loading spinner
}
