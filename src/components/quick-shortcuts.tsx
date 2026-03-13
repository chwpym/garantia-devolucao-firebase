
'use client';

import { Button } from '@/components/ui/button';
import { Wrench, History, Undo2, Package, CalculatorIcon } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';

export default function QuickShortcuts() {
    const router = useRouter();
    const { setActiveView, openNewLoteModal } = useAppStore();

    const handleNavigate = (view: string) => {
        setActiveView(view, true);
        router.push(`/${view}`);
    };

    const handleNewLoteClick = () => {
        openNewLoteModal();
    };

    return (
        <div className="hidden md:flex items-center justify-center flex-wrap gap-2">
            <Button variant="default" onClick={() => handleNavigate('register')}>
                <Wrench /> Nova Garantia
            </Button>
            <Button variant="outline" className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white" onClick={() => handleNavigate('batch-register')}>
                <History /> Garantia em Lote
            </Button>
            <Button variant="accent-blue" onClick={() => handleNavigate('devolucao-register')}>
                <Undo2 /> Nova Devolução
            </Button>
            <Button variant="accent-green" onClick={handleNewLoteClick}>
                <Package /> Novo Lote
            </Button>
            <Button variant="outline" className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white" onClick={() => handleNavigate('calculators')}>
                <CalculatorIcon /> Calculadoras
            </Button>
        </div>
    );
}
