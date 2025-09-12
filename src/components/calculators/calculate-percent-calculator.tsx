"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function CalculatePercentCalculator() {
  const [originalValue, setOriginalValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);

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
    <Card className="max-w-md mx-auto shadow-lg">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="originalValue">Valor Original</Label>
          <Input id="originalValue" type="number" placeholder="Ex: 1000" value={originalValue} onChange={e => setOriginalValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="percentage">Porcentagem (%)</Label>
          <Input id="percentage" type="number" placeholder="Ex: 25" value={percentage} onChange={e => setPercentage(e.target.value)} />
        </div>
        <Button onClick={handleCalculate}>Calcular</Button>
        {result !== null && (
          <div className="pt-4">
            <Label>Resultado</Label>
            <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base">
              {formatCurrency(result)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
