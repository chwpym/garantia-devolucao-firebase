'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ShoppingCart, Percent, Plus, FileScan, Tag, DivideCircle, Files, Microscope } from 'lucide-react';
import Link from 'next/link';


const calculators = [
  {
    id: 'average-price',
    icon: Calculator,
    title: 'Preço Médio',
    description: 'Calcule o preço médio de suas compras de ativos.',
  },
  {
    id: 'batch-pricing',
    icon: ShoppingCart,
    title: 'Precificação em Lote',
    description: 'Defina preços de venda para múltiplos produtos em lote.',
  },
  {
    id: 'calculate-sale',
    icon: Tag,
    title: 'Calcular Venda',
    description: 'Calcule o preço de venda a partir do custo e margem.',
  },
  {
    id: 'unit-cost',
    icon: DivideCircle,
    title: 'Custo Unitário',
    description: 'Encontre o custo por item a partir do total e quantidade.',
  },
  {
    id: 'calculate-percent',
    icon: Percent,
    title: 'Calcular Porcentagem',
    description: 'Encontre o valor de uma porcentagem de um número.',
  },
  {
    id: 'sum-percent',
    icon: Plus,
    title: 'Somar com Porcentagem',
    description: 'Adicione uma porcentagem a um valor inicial.',
  },
  {
    id: 'cost-analysis',
    icon: FileScan,
    title: 'Análise de Custo por NF-e',
    description: 'Importe uma NF-e para calcular o custo real dos produtos.',
  },
    {
    id: 'advanced-cost-analysis',
    icon: Microscope,
    title: 'Análise de Custo Avançada',
    description: 'Análise detalhada de NF-e com PIS/COFINS e mais.',
  },
  {
    id: 'compare-nfe',
    icon: Files,
    title: 'Comparador de NF-e',
    description: 'Compare produtos entre múltiplos arquivos XML de NF-e.',
  },
];


export default function CalculatorsSection() {
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
                {/* O link será implementado quando as páginas forem criadas */}
                <Button className="w-full" disabled>Acessar</Button>
                </CardContent>
            </Card>
            ))}
        </div>
    </div>
  );
}
