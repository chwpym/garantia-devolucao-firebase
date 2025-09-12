"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CalculateSaleCalculator() {
    const [cost, setCost] = useState("");
    const [margin, setMargin] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCost = e.target.value;
        setCost(newCost);
        const costValue = parseFloat(newCost);
        const marginValue = parseFloat(margin);

        if (!isNaN(costValue) && costValue > 0 && !isNaN(marginValue)) {
            const newPrice = costValue * (1 + marginValue / 100);
            setPrice(newPrice.toFixed(2));
            validatePrice(newPrice, costValue);
        } else if (newCost === "") {
           setPrice("");
           setMargin("");
           setError(null);
        }
    };

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMargin = e.target.value;
        setMargin(newMargin);
        const costValue = parseFloat(cost);
        const marginValue = parseFloat(newMargin);

        if (!isNaN(costValue) && costValue > 0 && !isNaN(marginValue)) {
            const newPrice = costValue * (1 + marginValue / 100);
            setPrice(newPrice.toFixed(2));
            validatePrice(newPrice, costValue);
        } else if (newMargin === "") {
            setPrice("");
        }
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPrice = e.target.value;
        setPrice(newPrice);
        const costValue = parseFloat(cost);
        const priceValue = parseFloat(newPrice);

        if (!isNaN(costValue) && costValue > 0 && !isNaN(priceValue)) {
            const newMargin = ((priceValue / costValue) - 1) * 100;
            setMargin(newMargin.toFixed(2));
            validatePrice(priceValue, costValue);
        } else if (newPrice === "") {
            setMargin("");
        }
    };

    const validatePrice = (priceValue: number, costValue: number) => {
        if (priceValue < costValue) {
            setError("O preço de venda não pode ser menor que o custo.");
        } else {
            setError(null);
        }
    }

    return (
        <Card className="max-w-md mx-auto shadow-lg">
            <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <Label htmlFor="cost">Custo do Produto (R$)</Label>
                    <Input id="cost" type="number" placeholder="Ex: 50" value={cost} onChange={handleCostChange}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="margin">Margem de Lucro (%)</Label>
                    <Input id="margin" type="number" placeholder="Ex: 40" value={margin} onChange={handleMarginChange}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Preço de Venda (R$)</Label>
                    <Input id="price" type="number" placeholder="Ex: 70" value={price} onChange={handlePriceChange}/>
                </div>
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
