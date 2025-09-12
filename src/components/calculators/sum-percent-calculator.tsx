"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function SumPercentCalculator() {
  const [initialValue, setInitialValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);

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
    <Card className="max-w-md mx-auto shadow-lg">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="initialValue">Valor Inicial</Label>
          <Input id="initialValue" type="number" placeholder="Ex: 1000" value={initialValue} onChange={e => setInitialValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sumPercentage">Porcentagem a Somar (%)</Label>
          <Input id="sumPercentage" type="number" placeholder="Ex: 15" value={percentage} onChange={e => setPercentage(e.target.value)} />
        </div>
        <Button onClick={handleCalculate}>Calcular Soma</Button>
        {result !== null && (
          <div className="pt-4">
            <Label>Valor Final</Label>
            <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base">
              {formatCurrency(result)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
