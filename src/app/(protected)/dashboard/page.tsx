
'use client';
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
    const router = useRouter();
    const setActiveView = useAppStore((s) => s.setActiveView);
    useEffect(() => {
        setActiveView('dashboard');
        router.replace('/');
    }, [router, setActiveView]);
    return null;
}
