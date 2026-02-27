"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency4 } from "@/lib/utils";
import { Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function SumPercentCalculator() {
  const [initialValue, setInitialValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toString());
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
    <Card className="max-w-md mx-auto shadow-lg">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="initialValue">Valor Inicial</Label>
          <Input id="initialValue" type="number" step="0.0001" placeholder="Ex: 1000" value={initialValue} onChange={e => setInitialValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sumPercentage">Porcentagem a Somar (%)</Label>
          <Input id="sumPercentage" type="number" step="0.0001" placeholder="Ex: 15" value={percentage} onChange={e => setPercentage(e.target.value)} />
        </div>
        <Button onClick={handleCalculate} className="w-full">Calcular Soma</Button>
        {result !== null && isFinite(result) && (
          <div className="pt-4">
            <Label>Valor Final</Label>
            <div className="flex w-full gap-2 items-center mt-1">
              <div className="flex-1 h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base font-bold text-primary">
                {formatCurrency4(result)}
              </div>
              <Button variant="outline" size="icon" onClick={() => handleCopy(result)}>
                  <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="pt-2 flex justify-center">
            <Button variant="ghost" onClick={handleClear} className="text-muted-foreground w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
