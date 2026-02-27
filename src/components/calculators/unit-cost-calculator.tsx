"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency4 } from "@/lib/utils";
import { Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function UnitCostCalculator() {
  const [totalValue, setTotalValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const { toast } = useToast();

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toString());
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
    <Card className="max-w-md mx-auto shadow-lg">
        <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
                <Label htmlFor="totalValue">Valor Total da Compra (R$)</Label>
                <Input 
                id="totalValue" 
                type="number" 
                step="0.0001"
                placeholder="Ex: 90,00" 
                value={totalValue} 
                onChange={e => setTotalValue(e.target.value)} 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade de Itens</Label>
                <Input 
                id="quantity" 
                type="number" 
                step="0.0001"
                placeholder="Ex: 30" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                />
            </div>
            {unitCost !== null && isFinite(unitCost) && (
                <div className="pt-4">
                <Label>Custo por Item</Label>
                <div className="flex w-full gap-2 items-center mt-1">
                    <div className="flex-1 h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base font-bold text-primary">
                        {formatCurrency4(unitCost)}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleCopy(unitCost)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            )}
            <div className="pt-4 flex justify-center">
                <Button variant="ghost" onClick={handleClear} className="text-muted-foreground w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
