
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ShoppingCart, Percent, Plus, FileScan, Tag, DivideCircle, Files, Microscope, ArrowLeft, Landmark, Replace } from 'lucide-react';
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
import { cn } from '@/lib/utils';


const calculators = [
  {
    id: 'purchase-simulator',
    icon: Replace,
    title: 'Simulador de Compra por NF-e',
    description: 'Simule compras alterando quantidades e itens de um XML.',
    component: PurchaseSimulatorCalculator,
    color: 'border-primary'
  },
  {
    id: 'tax-analysis',
    icon: Landmark,
    title: 'Análise de Impostos da NF-e',
    description: 'Extrai todos os impostos (ICMS, IPI, PIS/COFINS) de uma NF-e.',
    component: TaxAnalysisCalculator,
    color: 'border-accent-blue'
  },
  {
    id: 'advanced-cost-analysis',
    icon: Microscope,
    title: 'Análise de Custo Avançada',
    description: 'Análise detalhada de NF-e com crédito de PIS/COFINS.',
    component: AdvancedCostAnalysisCalculator,
    color: 'border-accent-green'
  },
  {
    id: 'cost-analysis',
    icon: FileScan,
    title: 'Análise de Custo por NF-e',
    description: 'Importe uma NF-e para calcular o custo real dos produtos.',
    component: CostAnalysisCalculator,
    color: 'border-primary'
  },
  {
    id: 'compare-nfe',
    icon: Files,
    title: 'Comparador de NF-e',
    description: 'Compare produtos entre múltiplos arquivos XML de NF-e.',
    component: NfeComparator,
    color: 'border-accent-blue'
  },
  {
    id: 'batch-pricing',
    icon: ShoppingCart,
    title: 'Precificação em Lote',
    description: 'Defina preços de venda para múltiplos produtos em lote.',
    component: BatchPricingCalculator,
    color: 'border-accent-green'
  },
  {
    id: 'calculate-sale',
    icon: Tag,
    title: 'Calcular Venda',
    description: 'Calcule o preço de venda a partir do custo e margem.',
    component: CalculateSaleCalculator,
    color: 'border-primary'
  },
  {
    id: 'average-price',
    icon: Calculator,
    title: 'Preço Médio',
    description: 'Calcule o preço médio de suas compras de ativos.',
    component: AveragePriceCalculator,
    color: 'border-accent-blue'
  },
  {
    id: 'unit-cost',
    icon: DivideCircle,
    title: 'Custo Unitário',
    description: 'Encontre o custo por item a partir do total e quantidade.',
    component: UnitCostCalculator,
    color: 'border-accent-green'
  },
  {
    id: 'calculate-percent',
    icon: Percent,
    title: 'Calcular Porcentagem',
    description: 'Encontre o valor de uma porcentagem de um número.',
    component: CalculatePercentCalculator,
    color: 'border-primary'
  },
  {
    id: 'sum-percent',
    icon: Plus,
    title: 'Somar com Porcentagem',
    description: 'Adicione uma porcentagem a um valor inicial.',
    component: SumPercentCalculator,
    color: 'border-accent-blue'
  },
];


export default function CalculatorsSection() {
    const [activeCalculatorId, setActiveCalculatorId] = useState<string | null>(null);

    const activeCalculator = calculators.find(c => c.id === activeCalculatorId);
    const ActiveCalculatorComponent = activeCalculator?.component;

    if (activeCalculator && ActiveCalculatorComponent) {
        return (
             <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                         <Button variant="ghost" onClick={() => setActiveCalculatorId(null)} className="mb-2 -ml-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Ferramentas
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">{activeCalculator.title}</h1>
                        <p className="text-lg text-muted-foreground">
                            {activeCalculator.description}
                        </p>
                    </div>
                </div>
                <ActiveCalculatorComponent />
            </div>
        )
    }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Calculadoras</h1>
            <p className="text-lg text-muted-foreground">
                Uma coleção de ferramentas úteis para o seu dia a dia.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculators.map((calc) => (
            <Card key={calc.id} className={cn("flex flex-col border-2 transition-colors hover:border-foreground/20", calc.color)}>
                <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                    <CardTitle className="flex items-center gap-2">
                        <calc.icon className="h-6 w-6 text-primary" />
                        {calc.title}
                    </CardTitle>
                    <CardDescription className="mt-2">{calc.description}</CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                <Button 
                    className="w-full" 
                    onClick={() => setActiveCalculatorId(calc.id)}
                >
                    Acessar
                </Button>
                </CardContent>
            </Card>
            ))}
        </div>
    </div>
  );
}
    
