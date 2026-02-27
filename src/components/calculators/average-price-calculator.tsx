"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Purchase {
  quantity: string;
  price: string;
}

interface PurchaseCardProps {
  title: string;
  purchase: Purchase;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalValue: number;
}

function PurchaseCard({ title, purchase, onChange, totalValue }: PurchaseCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`quantity-${title}`}>Quantidade</Label>
          <Input
            id={`quantity-${title}`}
            name="quantity"
            type="number"
            step="0.0001"
            placeholder="Ex: 100"
            value={purchase.quantity}
            onChange={onChange}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`price-${title}`}>Preço Unitário</Label>
          <Input
            id={`price-${title}`}
            name="price"
            type="number"
            step="0.0001"
            placeholder="Ex: 10,50"
            value={purchase.price}
            onChange={onChange}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Valor Total</Label>
          <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-input flex items-center text-base">
            {formatCurrency4(totalValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResultCardProps {
  totalQuantity: number;
  totalInvested: number;
  averagePrice: number;
}

function ResultCard({ totalQuantity, totalInvested, averagePrice }: ResultCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(averagePrice.toString());
    toast({
      title: "Copiado!",
      description: "Preço médio copiado para a área de transferência.",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Resultado Final</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <ResultItem label="Quantidade Total" value={formatNumber4(totalQuantity)} />
        <ResultItem label="Valor Total Investido" value={formatCurrency4(totalInvested)} />
        <ResultItem 
            label="Preço Médio" 
            value={formatCurrency4(averagePrice)} 
            isPrimary 
            onCopy={handleCopy} 
        />
      </CardContent>
    </Card>
  );
}

interface ResultItemProps {
  label: string;
  value: string;
  isPrimary?: boolean;
  onCopy?: () => void;
}

function ResultItem({ label, value, isPrimary = false, onCopy }: ResultItemProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-lg bg-muted ${isPrimary ? 'border border-primary bg-primary/5' : ''}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className={`text-2xl font-bold ${isPrimary ? 'text-primary' : ''}`}>{value}</p>
        {isPrimary && onCopy && (
           <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" onClick={onCopy} title="Copiar valor">
               <Copy className="h-4 w-4" />
           </Button>
        )}
      </div>
    </div>
  );
}

export default function AveragePriceCalculator() {
  const [firstPurchase, setFirstPurchase] = useState<Purchase>({ quantity: "", price: "" });
  const [secondPurchase, setSecondPurchase] = useState<Purchase>({ quantity: "", price: "" });

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <PurchaseCard
          title="Primeira Compra"
          purchase={firstPurchase}
          onChange={handlePurchaseChange(setFirstPurchase)}
          totalValue={calculations.total1}
        />
        <PurchaseCard
          title="Segunda Compra"
          purchase={secondPurchase}
          onChange={handlePurchaseChange(setSecondPurchase)}
          totalValue={calculations.total2}
        />
      </div>

      <ResultCard
        totalQuantity={calculations.totalQuantity}
        totalInvested={calculations.totalInvested}
        averagePrice={calculations.averagePrice}
      />

      <div className="mt-8 flex justify-center">
        <Button variant="destructive" onClick={clearFields}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar Campos
        </Button>
      </div>
    </>
  );
}
