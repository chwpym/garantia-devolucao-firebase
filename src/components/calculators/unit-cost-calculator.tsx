
'use client';

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency4 } from "@/lib/utils";
import { Copy, Trash2, Calculator, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UnitCostCalculator() {
  const [totalValue, setTotalValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const { toast } = useToast();

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toFixed(4));
    toast({
      title: "Copiado!",
      description: "Valor copiado para a área de transferência.",
    });
  };

  const handleClear = () => {
    setTotalValue("");
    setQuantity("");
  };

  const unitCost = useMemo(() => {
    const val = parseFloat(totalValue);
    const qty = parseFloat(quantity);
    if (!isNaN(val) && !isNaN(qty) && qty > 0) {
      return val / qty;
    }
    return null;
  }, [totalValue, quantity]);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2 mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
                <Calculator size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Custo Unitário</h2>
            <p className="text-sm text-muted-foreground">Calcule rapidamente o custo individual baseado no valor total da compra.</p>
        </div>

         <Card className="border border-border shadow-2xl bg-card text-foreground overflow-hidden rounded-3xl">
            <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-70">Valor Total da Compra</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">R$</span>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00" 
                                value={totalValue} 
                                onChange={e => setTotalValue(e.target.value)} 
                                className="h-12 pl-10 font-black text-lg bg-background border-border transition-all"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-70">Quantidade de Itens</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                step="1"
                                placeholder="0" 
                                value={quantity} 
                                onChange={e => setQuantity(e.target.value)} 
                                className="h-12 font-black text-lg bg-background border-border transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs uppercase">Unidades</span>
                        </div>
                    </div>
                </div>

                 {unitCost !== null && isFinite(unitCost) ? (
                    <div className="pt-6 border-t border-border">
                        <div className="bg-foreground text-background rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                                <ArrowRightLeft size={80} />
                            </div>
                            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest block mb-1">Custo por Item</span>
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-4xl font-black">{formatCurrency4(unitCost)}</p>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => handleCopy(unitCost)}
                                    className="bg-background/10 hover:bg-background/20 text-background border-none h-10 px-4 rounded-xl font-black"
                                >
                                    <Copy className="mr-2 h-4 w-4" /> Copiar
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pt-6 border-t border-border flex items-center justify-center py-8 text-muted-foreground italic text-sm">
                        Preencha os valores para ver o resultado
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
