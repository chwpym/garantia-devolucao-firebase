
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
        router.push('/lotes');
    };

    return (
        <div className="hidden md:flex items-center justify-center flex-wrap gap-2">
            <Button variant="outline" className="gap-1.5 shadow-md bg-background/60 backdrop-blur-md border-primary/20 hover:border-primary/50 text-foreground" onClick={() => handleNavigate('register')}>
                <Wrench className="h-4 w-4 text-primary" /> Nova Garantia
            </Button>
            <Button variant="outline" className="gap-1.5 shadow-md bg-background/60 backdrop-blur-md border-orange-400/20 hover:border-orange-500 text-foreground" onClick={() => handleNavigate('batch-register')}>
                <History className="h-4 w-4 text-orange-400" /> Garantia em Lote
            </Button>
            <Button variant="outline" className="gap-1.5 shadow-md bg-background/60 backdrop-blur-md border-[hsl(var(--accent-blue))]/20 hover:border-[hsl(var(--accent-blue))] text-foreground" onClick={() => handleNavigate('devolucao-register')}>
                <Undo2 className="h-4 w-4 text-[hsl(var(--accent-blue))]" /> Nova Devolução
            </Button>
            <Button variant="outline" className="gap-1.5 shadow-md bg-background/60 backdrop-blur-md border-[hsl(var(--accent-green))]/20 hover:border-[hsl(var(--accent-green))] text-foreground" onClick={handleNewLoteClick}>
                <Package className="h-4 w-4 text-[hsl(var(--accent-green))]" /> Novo Lote
            </Button>
            <Button variant="outline" className="gap-1.5 shadow-md bg-background/60 backdrop-blur-md border-orange-400/20 hover:border-orange-500 text-foreground" onClick={() => handleNavigate('calculators')}>
                <CalculatorIcon className="h-4 w-4 text-orange-400" /> Calculadoras
            </Button>
        </div>
    );
}
