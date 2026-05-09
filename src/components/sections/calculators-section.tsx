
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Calculator, ShoppingCart, Percent, Plus, FileScan, Tag, 
    DivideCircle, Files, Microscope, ArrowLeft, Landmark, 
    Replace, Info, ChevronRight, Sparkles
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
import { cn } from '@/lib/utils';

const calculators = [
  {
    id: 'nfe-origin-analyzer',
    icon: Info,
    title: 'Origem de Mercadoria',
    description: 'Análise automática da Origem (Legenda 0-8) via XML.',
    component: NfeProductOriginCalculator,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20'
  },
  {
    id: 'purchase-simulator',
    icon: Replace,
    title: 'Simulador de Compra',
    description: 'Simule alterações de preços e quantidades em notas fiscais.',
    component: PurchaseSimulatorCalculator,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20'
  },
  {
    id: 'tax-analysis',
    icon: Landmark,
    title: 'Análise de Impostos',
    description: 'Auditoria completa de ICMS, IPI e PIS/COFINS por item.',
    component: TaxAnalysisCalculator,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20'
  },
  {
    id: 'cost-analysis',
    icon: FileScan,
    title: 'Análise de Custo',
    description: 'Decomposição de custos com rateio automático de despesas.',
    component: CostAnalysisCalculator,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20'
  },
  {
    id: 'advanced-cost-analysis',
    icon: Microscope,
    title: 'Análise Técnica Pro',
    description: 'Cálculo profundo com créditos de impostos e Reforma Tributária.',
    component: AdvancedCostAnalysisCalculator,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/20'
  },
  {
    id: 'compare-nfe',
    icon: Files,
    title: 'Comparador de XMLs',
    description: 'Compare variações de preços entre múltiplas notas fiscais.',
    component: NfeComparator,
    color: 'text-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-900/40'
  },
  {
    id: 'batch-pricing',
    icon: ShoppingCart,
    title: 'Precificação em Lote',
    description: 'Defina preços de venda estratégicos para toda a nota.',
    component: BatchPricingCalculator,
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950/20'
  },
  {
    id: 'calculate-sale',
    icon: Tag,
    title: 'Markup & Venda',
    description: 'Encontre o preço ideal baseado na margem desejada.',
    component: CalculateSaleCalculator,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20'
  },
  {
    id: 'average-price',
    icon: Calculator,
    title: 'Preço Médio',
    description: 'Calcule a média ponderada de estoque e aquisições.',
    component: AveragePriceCalculator,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20'
  },
  {
    id: 'unit-cost',
    icon: DivideCircle,
    title: 'Custo Unitário',
    description: 'Cálculo simples de divisão por quantidade.',
    component: UnitCostCalculator,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/20'
  },
  {
    id: 'calculate-percent',
    icon: Percent,
    title: 'Porcentagem',
    description: 'Extração rápida de valores percentuais.',
    component: CalculatePercentCalculator,
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/20'
  },
  {
    id: 'sum-percent',
    icon: Plus,
    title: 'Acréscimo %',
    description: 'Soma rápida de margens e taxas.',
    component: SumPercentCalculator,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950/20'
  },
];

export default function CalculatorsSection() {
    const [activeCalculatorId, setActiveCalculatorId] = useState<string | null>(null);

    const activeCalculator = calculators.find(c => c.id === activeCalculatorId);
    const ActiveCalculatorComponent = activeCalculator?.component;

    if (activeCalculator && ActiveCalculatorComponent) {
        return (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-950 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div>
                         <Button 
                            variant="ghost" 
                            onClick={() => setActiveCalculatorId(null)} 
                            className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Painel
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl", activeCalculator.bg)}>
                                <activeCalculator.icon className={cn("h-6 w-6", activeCalculator.color)} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">{activeCalculator.title}</h1>
                        </div>
                        <p className="text-muted-foreground mt-2 max-w-2xl font-medium">
                            {activeCalculator.description}
                        </p>
                    </div>
                </div>
                <ActiveCalculatorComponent />
            </div>
        )
    }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
        <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                <Sparkles size={200} />
            </div>
            <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tight">Fiscal Calculator Suite</h1>
                <p className="text-slate-300 mt-2 text-lg font-medium max-w-xl leading-relaxed">
                    Ferramentas inteligentes para auditoria fiscal, análise de custos e formação de preços estratégica.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {calculators.map((calc) => (
            <Card 
                key={calc.id} 
                className="group relative flex flex-col border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 cursor-pointer"
                onClick={() => setActiveCalculatorId(calc.id)}
            >
                <div className={cn("h-2 w-full", calc.bg.replace('bg-', 'bg-').replace('50', '500'))} />
                <CardHeader className="p-8 pb-4">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 shadow-sm", calc.bg)}>
                        <calc.icon className={cn("h-7 w-7", calc.color)} />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {calc.title}
                    </CardTitle>
                    <CardDescription className="mt-3 text-slate-500 font-medium leading-snug">
                        {calc.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Acessar Ferramenta</span>
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <ChevronRight className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
    </div>
  );
}
