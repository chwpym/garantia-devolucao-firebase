
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
    color: 'text-accent-green',
    bg: 'bg-accent-green/10'
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
    color: 'text-foreground/70',
    bg: 'bg-muted/50'
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
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-[2rem] shadow-md border border-border">
                    <div>
                         <Button 
                            variant="ghost" 
                            onClick={() => setActiveCalculatorId(null)} 
                            className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Painel
                        </Button>
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl shadow-inner", activeCalculator.bg)}>
                                <activeCalculator.icon className={cn("h-7 w-7", activeCalculator.color)} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">{activeCalculator.title}</h1>
                        </div>
                        <p className="text-muted-foreground mt-3 max-w-2xl font-black opacity-70 text-xs uppercase tracking-wide">
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
        <div className="relative overflow-hidden bg-foreground text-background rounded-[2.5rem] p-12 shadow-2xl">
            <div className="absolute right-[-40px] top-[-40px] opacity-10 rotate-12">
                <Sparkles size={300} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter">Fiscal Calculator Suite</h1>
                    <p className="text-background/80 mt-3 text-lg font-black uppercase tracking-tight max-w-xl leading-snug opacity-70">
                        Ferramentas inteligentes para auditoria fiscal, análise de custos e formação de preços estratégica.
                    </p>
                </div>
                <div className="flex shrink-0">
                     <div className="bg-background/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-background/20">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total de Ferramentas</span>
                         <p className="text-3xl font-black">{calculators.length}</p>
                     </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {calculators.map((calc) => (
            <Card 
                key={calc.id} 
                className="group relative flex flex-col border border-border shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-card cursor-pointer border-opacity-50"
                onClick={() => setActiveCalculatorId(calc.id)}
            >
                <div className={cn("h-1.5 w-full", calc.bg.replace('/10', ''))} />
                <CardHeader className="p-8 pb-4">
                    <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 shadow-sm border border-border/10", calc.bg)}>
                        <calc.icon className={cn("h-8 w-8", calc.color)} />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {calc.title}
                    </CardTitle>
                    <CardDescription className="mt-3 text-muted-foreground font-black opacity-70 text-xs uppercase tracking-wide leading-relaxed">
                        {calc.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Acessar Ferramenta</span>
                    <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                        <ChevronRight className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
    </div>
  );
}
