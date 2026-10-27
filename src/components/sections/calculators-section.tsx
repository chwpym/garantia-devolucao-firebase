'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Calculator, ShoppingCart, Percent, Plus, FileScan, Tag, 
    DivideCircle, Files, Microscope, ArrowLeft, Landmark, 
    Replace, Info, ChevronRight, Sparkles, FileSearch, FileCheck2
} from 'lucide-react';
import AveragePriceCalculator from '@/components/calculators/average-price-calculator';
import BatchPricingCalculator from '@/components/calculators/batch-pricing-calculator';
import CalculateSaleCalculator from '@/components/calculators/calculate-sale-calculator';
import UnitCostCalculator from '../calculators/unit-cost-calculator';
import CalculatePercentCalculator from '../calculators/calculate-percent-calculator';
import SumPercentCalculator from '../calculators/sum-percent-calculator';
import CostAnalysisCalculator from '../calculators/cost-analysis-calculator';
import AdvancedCostAnalysisCalculator from '../calculators/advanced-cost-analysis-calculator';
import NfeComparator from '../calculators/nfe-comparator';
import TaxAnalysisCalculator from '../calculators/tax-analysis-calculator';
import PurchaseSimulatorCalculator from '../calculators/purchase-simulator-calculator';
import NfeProductOriginCalculator from '../calculators/nfe-origin-calculator';
import NfeItemLocatorCalculator from '../calculators/nfe-item-locator';
import CcePdfGenerator from '../calculators/cce-pdf-generator';
import { cn } from '@/lib/utils';

const calculators = [
  {
    id: 'cce-pdf-generator',
    icon: FileCheck2,
    title: 'PDF Carta de Correção (CC-e)',
    description: 'Une os XMLs (ped + rec) da CC-e e gera o PDF idêntico ao site da SEFAZ.',
    component: CcePdfGenerator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'nfe-item-locator',
    icon: FileSearch,
    title: 'Localizador de Item XML',
    description: 'Busca rápida Multi-XML com Nº do Item (nItem), Chave e NF de Origem.',
    component: NfeItemLocatorCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'nfe-origin-analyzer',
    icon: Info,
    title: 'Origem de Mercadoria',
    description: 'Análise automática da Origem (Legenda 0-8) via XML.',
    component: NfeProductOriginCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'purchase-simulator',
    icon: Replace,
    title: 'Simulador de Compra',
    description: 'Simule alterações de preços e quantidades em notas fiscais.',
    component: PurchaseSimulatorCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'tax-analysis',
    icon: Landmark,
    title: 'Análise de Impostos',
    description: 'Auditoria completa de ICMS, IPI e PIS/COFINS por item.',
    component: TaxAnalysisCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'cost-analysis',
    icon: FileScan,
    title: 'Análise de Custo',
    description: 'Decomposição de custos com rateio automático de despesas.',
    component: CostAnalysisCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'advanced-cost-analysis',
    icon: Microscope,
    title: 'Análise Técnica Pro',
    description: 'Cálculo profundo com créditos de impostos e Reforma Tributária.',
    component: AdvancedCostAnalysisCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'compare-nfe',
    icon: Files,
    title: 'Comparador de XMLs',
    description: 'Compare variações de preços entre múltiplas notas fiscais.',
    component: NfeComparator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'batch-pricing',
    icon: ShoppingCart,
    title: 'Precificação em Lote',
    description: 'Defina preços de venda estratégicos para toda a nota.',
    component: BatchPricingCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'calculate-sale',
    icon: Tag,
    title: 'Markup & Venda',
    description: 'Encontre o preço ideal baseado na margem desejada.',
    component: CalculateSaleCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'average-price',
    icon: Calculator,
    title: 'Preço Médio',
    description: 'Calcule a média ponderada de estoque e aquisições.',
    component: AveragePriceCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'unit-cost',
    icon: DivideCircle,
    title: 'Custo Unitário',
    description: 'Cálculo simples de divisão por quantidade.',
    component: UnitCostCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'calculate-percent',
    icon: Percent,
    title: 'Porcentagem',
    description: 'Extração rápida de valores percentuais.',
    component: CalculatePercentCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'sum-percent',
    icon: Plus,
    title: 'Acréscimo %',
    description: 'Soma rápida de margens e taxas.',
    component: SumPercentCalculator,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
];

export default function CalculatorsSection() {
    const [activeCalculatorId, setActiveCalculatorId] = useState<string | null>(null);

    const activeCalculator = calculators.find(c => c.id === activeCalculatorId);
    const ActiveCalculatorComponent = activeCalculator?.component;

    if (activeCalculator && ActiveCalculatorComponent) {
        return (
            <div className="space-y-3 pr-3 pb-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-2.5 rounded-xl shadow-sm border border-border">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActiveCalculatorId(null)} 
                            className="h-8 px-2.5 text-muted-foreground hover:text-primary transition-colors font-bold uppercase text-xs tracking-wider"
                        >
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar
                        </Button>
                        <div className="h-4 w-[1px] bg-border" />
                        <div className="flex items-center gap-2.5">
                            <div className={cn("p-1.5 rounded-lg", activeCalculator.bg)}>
                                <activeCalculator.icon className={cn("h-4 w-4", activeCalculator.color)} />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <h1 className="text-sm font-semibold tracking-tight text-foreground">{activeCalculator.title}</h1>
                                <span className="hidden md:inline text-muted-foreground/40 text-xs">•</span>
                                <p className="text-muted-foreground font-semibold text-xs">
                                    {activeCalculator.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <ActiveCalculatorComponent />
            </div>
        );
    }

    return (
        <div className="space-y-5 pr-3 pb-4 animate-in fade-in duration-500">
            {/* Banner Superior Compacto */}
            <div className="relative overflow-hidden bg-foreground text-background rounded-2xl px-6 py-5 shadow-lg">
                <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 pointer-events-none">
                    <Sparkles size={160} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Fiscal Calculator Suite</h1>
                        <p className="text-background/80 mt-1 text-xs font-bold uppercase tracking-wide opacity-75">
                            Ferramentas inteligentes para auditoria fiscal, análise de custos e formação de preços estratégica.
                        </p>
                    </div>
                    <div className="flex shrink-0">
                        <div className="bg-background/10 backdrop-blur-md py-2 px-4 rounded-xl border border-background/20 flex items-center gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Ferramentas</span>
                            <p className="text-xl font-semibold">{calculators.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Cards Compactos com Ícone e Nome Lado a Lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {calculators.map((calc) => (
                    <Card 
                        key={calc.id} 
                        className="group relative flex flex-col justify-between border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 rounded-2xl overflow-hidden bg-card cursor-pointer p-4"
                        onClick={() => setActiveCalculatorId(calc.id)}
                    >
                        <div className={cn("absolute top-0 left-0 right-0 h-1", calc.bg.replace('/10', ''))} />

                        <div className="space-y-2 pt-0.5">
                            {/* Ícone + Título Lado a Lado */}
                            <div className="flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300 border border-border/10", calc.bg)}>
                                        <calc.icon className={cn("h-4 w-4", calc.color)} />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                                        {calc.title}
                                    </h3>
                                </div>
                                <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </div>
                            </div>

                            {/* Descrição Compacta */}
                            <p className="text-muted-foreground font-semibold text-xs leading-snug line-clamp-2 opacity-80">
                                {calc.description}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
