
'use client';

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency4 } from "@/lib/utils";
import { Copy, Trash2, PlusCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function SumPercentCalculator() {
  const [initialValue, setInitialValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toFixed(4));
    toast({
      title: "Copiado!",
      description: "Valor copiado para a área de transferência.",
    });
  };

  const handleClear = () => {
    setInitialValue("");
    setPercentage("");
    setResult(null);
  };

  const handleCalculate = () => {
    const val = parseFloat(initialValue);
    const pct = parseFloat(percentage);
    if (!isNaN(val) && !isNaN(pct)) {
      setResult(val + ((val * pct) / 100));
    } else {
      setResult(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mb-2">
                <PlusCircle size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Somar Porcentagem</h2>
            <p className="text-sm text-muted-foreground">Adicione uma margem ou acréscimo percentual a qualquer valor inicial.</p>
        </div>

        <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden rounded-3xl">
            <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Valor Inicial</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00" 
                                value={initialValue} 
                                onChange={e => setInitialValue(e.target.value)} 
                                className="h-12 pl-10 font-black text-lg bg-slate-50/50 border-slate-100 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Acréscimo (%)</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0,00" 
                                value={percentage} 
                                onChange={e => setPercentage(e.target.value)} 
                                className="h-12 font-black text-lg bg-slate-50/50 border-slate-100 focus:bg-white transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg">%</span>
                        </div>
                    </div>
                </div>

                <Button onClick={handleCalculate} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95">
                    Calcular Valor Final
                </Button>

                {result !== null && isFinite(result) && (
                    <div className="pt-6 border-t border-slate-50">
                        <div className="bg-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden group">
                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-100 tracking-widest block mb-1">Valor Final Acumulado</span>
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-4xl font-black">{formatCurrency4(result)}</p>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => handleCopy(result)}
                                    className="bg-white/20 hover:bg-white/30 text-white border-none h-10 px-4 rounded-xl"
                                >
                                    <Copy className="mr-2 h-4 w-4" /> Copiar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center pt-2">
                    <Button variant="ghost" onClick={handleClear} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest">
                        <Trash2 className="mr-2 h-4 w-4" /> Limpar Campos
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
