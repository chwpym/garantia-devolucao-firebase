
'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Calculator, Info, TrendingUp, History, Package } from "lucide-react";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Badge } from "@/components/ui/badge";

interface Purchase {
  quantity: string;
  price: string;
}

export default function AveragePriceCalculator() {
  const { currentNfe } = useNfeStore();
  const [firstPurchase, setFirstPurchase] = useState<Purchase>({ quantity: "", price: "" });
  const [secondPurchase, setSecondPurchase] = useState<Purchase>({ quantity: "", price: "" });
  const { toast } = useToast();

  const handlePurchaseChange = (setter: React.Dispatch<React.SetStateAction<Purchase>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

  const clearFields = useCallback(() => {
    setFirstPurchase({ quantity: "", price: "" });
    setSecondPurchase({ quantity: "", price: "" });
  }, []);

  const calculations = useMemo(() => {
    const q1 = parseFloat(firstPurchase.quantity) || 0;
    const p1 = parseFloat(firstPurchase.price) || 0;
    const q2 = parseFloat(secondPurchase.quantity) || 0;
    const p2 = parseFloat(secondPurchase.price) || 0;

    const total1 = q1 * p1;
    const total2 = q2 * p2;

    const totalQuantity = q1 + q2;
    const totalInvested = total1 + total2;
    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

    return { total1, total2, totalQuantity, totalInvested, averagePrice };
  }, [firstPurchase, secondPurchase]);

  const handleCopy = () => {
    navigator.clipboard.writeText(calculations.averagePrice.toFixed(4));
    toast({
      title: "Copiado!",
      description: "Preço médio copiado para a área de transferência.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Cálculo de Preço Médio
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Equalização de Estoque e Compras</p>
        </div>
        <div className="flex items-center gap-2">
            <NfeUploader />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl bg-white dark:bg-slate-950 overflow-hidden rounded-2xl relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                <History className="h-4 w-4" /> Primeiro Lote (Estoque)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Quantidade Atual</Label>
              <Input
                name="quantity"
                type="number"
                placeholder="0.00"
                value={firstPurchase.quantity}
                onChange={handlePurchaseChange(setFirstPurchase)}
                className="h-11 font-black text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Custo Unitário Atual</Label>
              <Input
                name="price"
                type="number"
                placeholder="R$ 0,00"
                value={firstPurchase.price}
                onChange={handlePurchaseChange(setFirstPurchase)}
                className="h-11 font-black text-lg"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Valor do Lote:</span>
              <span className="font-mono text-sm font-bold text-slate-600">{formatCurrency(calculations.total1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-950 overflow-hidden rounded-2xl relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                <Package className="h-4 w-4" /> Segundo Lote (Nova Compra)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Quantidade Nova</Label>
              <Input
                name="quantity"
                type="number"
                placeholder="0.00"
                value={secondPurchase.quantity}
                onChange={handlePurchaseChange(setSecondPurchase)}
                className="h-11 font-black text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Custo Unitário Novo</Label>
              <Input
                name="price"
                type="number"
                placeholder="R$ 0,00"
                value={secondPurchase.price}
                onChange={handlePurchaseChange(setSecondPurchase)}
                className="h-11 font-black text-lg"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Valor do Lote:</span>
              <span className="font-mono text-sm font-bold text-slate-600">{formatCurrency(calculations.total2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden rounded-2xl relative">
        <div className="absolute right-[-20px] top-[-20px] opacity-10">
          <TrendingUp size={120} />
        </div>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantidade Final</span>
                <p className="text-3xl font-black">{formatNumber(calculations.totalQuantity)}</p>
                <p className="text-[10px] text-slate-500 font-medium">Soma total das unidades em estoque.</p>
            </div>
            <div className="space-y-1 border-slate-800 md:border-l md:pl-8">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investimento Total</span>
                <p className="text-3xl font-black text-indigo-400">{formatCurrency(calculations.totalInvested)}</p>
                <p className="text-[10px] text-slate-500 font-medium">Capital total alocado neste produto.</p>
            </div>
            <div className="space-y-1 border-slate-800 md:border-l md:pl-8 relative">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Novo Preço Médio</span>
                <div className="flex items-center gap-3">
                    <p className="text-4xl font-black text-white">{formatCurrency4(calculations.averagePrice)}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-full">
                        <Copy size={16} />
                    </Button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Custo unitário equalizado após as compras.</p>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={clearFields} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
          <Trash2 className="mr-2 h-4 w-4" /> Limpar Todos os Campos
        </Button>
      </div>
    </div>
  );
}
