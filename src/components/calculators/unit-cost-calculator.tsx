"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function UnitCostCalculator() {
  const [totalValue, setTotalValue] = useState("");
  const [quantity, setQuantity] = useState("");

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
                placeholder="Ex: 30" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                />
            </div>
            {unitCost !== null && (
                <div className="pt-4">
                <Label>Custo por Item</Label>
                <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base font-bold text-primary">
                    {formatCurrency(unitCost)}
                </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
