'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ShoppingCart, Percent, Plus, FileScan, Tag, DivideCircle, Files, Microscope, ArrowLeft } from 'lucide-react';
import AveragePriceCalculator from '@/components/calculators/average-price-calculator';
import BatchPricingCalculator from '@/components/calculators/batch-pricing-calculator';
import CalculateSaleCalculator from '@/components/calculators/calculate-sale-calculator';
import UnitCostCalculator from '../calculators/unit-cost-calculator';


const calculators = [
  {
    id: 'average-price',
    icon: Calculator,
    title: 'Preço Médio',
    description: 'Calcule o preço médio de suas compras de ativos.',
    component: AveragePriceCalculator,
  },
  {
    id: 'batch-pricing',
    icon: ShoppingCart,
    title: 'Precificação em Lote',
    description: 'Defina preços de venda para múltiplos produtos em lote.',
    component: BatchPricingCalculator,
  },
  {
    id: 'calculate-sale',
    icon: Tag,
    title: 'Calcular Venda',
    description: 'Calcule o preço de venda a partir do custo e margem.',
    component: CalculateSaleCalculator,
  },
  {
    id: 'unit-cost',
    icon: DivideCircle,
    title: 'Custo Unitário',
    description: 'Encontre o custo por item a partir do total e quantidade.',
    component: UnitCostCalculator,
  },
  {
    id: 'calculate-percent',
    icon: Percent,
    title: 'Calcular Porcentagem',
    description: 'Encontre o valor de uma porcentagem de um número.',
    component: null,
  },
  {
    id: 'sum-percent',
    icon: Plus,
    title: 'Somar com Porcentagem',
    description: 'Adicione uma porcentagem a um valor inicial.',
    component: null,
  },
  {
    id: 'cost-analysis',
    icon: FileScan,
    title: 'Análise de Custo por NF-e',
    description: 'Importe uma NF-e para calcular o custo real dos produtos.',
    component: null,
  },
    {
    id: 'advanced-cost-analysis',
    icon: Microscope,
    title: 'Análise de Custo Avançada',
    description: 'Análise detalhada de NF-e com PIS/COFINS e mais.',
    component: null,
  },
  {
    id: 'compare-nfe',
    icon: Files,
    title: 'Comparador de NF-e',
    description: 'Compare produtos entre múltiplos arquivos XML de NF-e.',
    component: null,
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
            <Card key={calc.id} className="flex flex-col">
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
                    disabled={!calc.component}
                    onClick={() => calc.component && setActiveCalculatorId(calc.id)}
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
