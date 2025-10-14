
'use client';

import { Button } from '@/components/ui/button';
import { Wrench, History, Undo2, Package, CalculatorIcon } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export default function QuickShortcuts() {
    const { openTab, openNewLoteModal } = useAppStore();

    const handleNewLoteClick = () => {
        openNewLoteModal();
    };

    return (
        <div className="flex items-center justify-center flex-wrap gap-2">
            <Button variant="default" onClick={() => openTab('register')}>
                <Wrench /> Nova Garantia
            </Button>
            <Button variant="outline" className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white" onClick={() => openTab('batch-register')}>
                <History /> Garantia em Lote
            </Button>
            <Button variant="accent-blue" onClick={() => openTab('devolucao-register')}>
                <Undo2 /> Nova Devolução
            </Button>
            <Button variant="accent-green" onClick={handleNewLoteClick}>
                <Package /> Novo Lote
            </Button>
            <Button variant="outline" className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white" onClick={() => openTab('calculators')}>
                <CalculatorIcon /> Calculadoras
            </Button>
        </div>
    );
}
