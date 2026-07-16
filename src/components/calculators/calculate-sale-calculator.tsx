
'use client';

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash2, Tag, Percent, DollarSign, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
            setPrice(Number(Math.round(newPrice * 10000) / 10000).toString());
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
            setPrice(Number(Math.round(newPrice * 10000) / 10000).toString());
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
            setMargin(Number(Math.round(newMargin * 10000) / 10000).toString());
            validatePrice(priceValue, costValue);
        } else if (newPrice === "") {
            setMargin("");
        }
    };

    const validatePrice = (priceValue: number, costValue: number) => {
        if (priceValue < costValue) {
            setError("O preço de venda é menor que o custo. Margem negativa!");
        } else {
            setError(null);
        }
    }

    const handleClear = () => {
        setCost("");
        setMargin("");
        setPrice("");
        setError(null);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
                    <Tag size={24} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Markup & Preço de Venda</h2>
                <p className="text-sm text-muted-foreground">Calcule a margem de lucro ou defina o preço de venda ideal para seus produtos.</p>
            </div>

             <Card className="border border-border shadow-2xl bg-card text-foreground overflow-hidden rounded-3xl">
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-70">Custo do Produto</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">R$</span>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0,00" 
                                    value={cost} 
                                    onChange={handleCostChange}
                                    className="h-12 pl-10 font-black text-lg bg-background border-border focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                    <Percent size={12} /> Margem (%)
                                </Label>
                                <Input 
                                    type="number" 
                                    step="0.1"
                                    placeholder="0,00" 
                                    value={margin} 
                                    onChange={handleMarginChange}
                                    className="h-12 font-black text-lg bg-primary/5 border-primary/20 focus:bg-background transition-all"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
                                    <DollarSign size={12} /> Preço de Venda
                                </Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0,00" 
                                    value={price} 
                                    onChange={handlePriceChange}
                                    className="h-12 font-black text-lg bg-emerald-500/5 border-emerald-500/20 focus:bg-background transition-all"
                                />
                            </div>
                        </div>
                    </div>

                     {error && (
                        <Alert variant="destructive" className="rounded-xl border-none bg-destructive/10 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-black uppercase">Atenção</AlertTitle>
                            <AlertDescription className="text-xs font-black">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                     {!error && cost && price && (
                         <div className="pt-6 border-t border-border">
                            <div className="bg-foreground text-background rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight size={80} />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest block mb-1">Lucro Bruto por Unidade</span>
                                        <p className="text-4xl font-black text-accent-green">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(price) - parseFloat(cost))}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest block mb-1">Markup</span>
                                        <p className="text-xl font-black text-primary">{margin}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                     <div className="flex justify-center pt-2">
                        <Button variant="ghost" onClick={handleClear} className="text-destructive hover:text-destructive hover:bg-destructive/10 font-black text-xs uppercase tracking-widest rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" /> Limpar Tudo
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
