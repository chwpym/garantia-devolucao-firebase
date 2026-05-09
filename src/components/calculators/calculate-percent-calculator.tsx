
'use client';

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency4 } from "@/lib/utils";
import { Copy, Trash2, Calculator, Percent, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function CalculatePercentCalculator() {
  const [originalValue, setOriginalValue] = useState("");
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
    setOriginalValue("");
    setPercentage("");
    setResult(null);
  };

  const handleCalculate = () => {
    const val = parseFloat(originalValue);
    const pct = parseFloat(percentage);
    if (!isNaN(val) && !isNaN(pct)) {
      setResult((val * pct) / 100);
    } else {
      setResult(null);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2 mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
                <Percent size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Cálculo de Porcentagem</h2>
            <p className="text-sm text-muted-foreground">Extraia rapidamente o valor correspondente a uma porcentagem específica.</p>
        </div>

         <Card className="border border-border shadow-2xl bg-card text-foreground overflow-hidden rounded-3xl">
            <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-70">Valor de Referência</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">R$</span>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00" 
                                value={originalValue} 
                                onChange={e => setOriginalValue(e.target.value)} 
                                className="h-12 pl-10 font-black text-lg bg-background border-border focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-70">Alíquota / Porcentagem</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0,00" 
                                value={percentage} 
                                onChange={e => setPercentage(e.target.value)} 
                                className="h-12 font-black text-lg bg-background border-border focus:ring-primary/20 transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-black text-lg">%</span>
                        </div>
                    </div>
                </div>

                 <Button onClick={handleCalculate} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-lg transition-all active:scale-95">
                    Calcular Porcentagem
                </Button>

                 {result !== null && isFinite(result) && (
                    <div className="pt-6 border-t border-border">
                        <div className="bg-foreground text-background rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                                <Sparkles size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest block mb-1">Resultado Extraído</span>
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-4xl font-black">{formatCurrency4(result)}</p>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => handleCopy(result)}
                                    className="bg-background/20 hover:bg-background/30 text-background border-none h-10 px-4 rounded-xl font-black"
                                >
                                    <Copy className="mr-2 h-4 w-4" /> Copiar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                 <div className="flex justify-center pt-2">
                    <Button variant="ghost" onClick={handleClear} className="text-destructive hover:text-destructive hover:bg-destructive/10 font-black text-xs uppercase tracking-widest rounded-xl">
                        <Trash2 className="mr-2 h-4 w-4" /> Limpar Campos
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
