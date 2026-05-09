
'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Info, Printer, ChevronsRight, Tag, Percent, ArrowRightLeft, Calculator, TrendingUp, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4 } from "@/lib/utils";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Card, CardContent } from "@/components/ui/card";

interface BatchPriceItem {
    id: string;
    cProd: string;
    description: string;
    quantity: number;
    originalUnitCost: number;
    impostosUnit: number;
    descontoUnit: number;
    finalUnitCost: number;
    fatorConversao: string;
    margin: string;
    impostoSobreVenda: string;
    price: string;
    vIPI?: number;
    vICMSST?: number;
    vIBS?: number;
    vCBS?: number;
}

export default function BatchPricingCalculator() {
    const { currentNfe } = useNfeStore();
    const [items, setItems] = useState<BatchPriceItem[]>([]);
    const [globalMargin, setGlobalMargin] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        if (!currentNfe) {
            setItems([]);
            return;
        }

        const totalProdFromXml = currentNfe.totals.vProd || 0;
        const totalFrete = currentNfe.totals.vFrete || 0;
        const totalSeguro = currentNfe.totals.vSeg || 0;
        const totalDesconto = currentNfe.totals.vDesc || 0;
        const totalOutras = currentNfe.totals.vOutro || 0;

        const newItems: BatchPriceItem[] = currentNfe.items.map((item, index) => {
            const itemWeight = totalProdFromXml > 0 ? item.vProd / totalProdFromXml : 0;
            
            const freteRateado = item.vFrete || (totalFrete * itemWeight);
            const seguroRateado = item.vSeg || (totalSeguro * itemWeight);
            const outrasRateado = item.vOutro || (totalOutras * itemWeight);
            const descontoRateado = item.vDesc || (totalDesconto * itemWeight);

            const vIPI = item.taxes.vIPI || 0;
            const vICMSST = item.taxes.vICMSST || 0;
            const vIBS = item.taxes.vIBS || 0;
            const vCBS = item.taxes.vCBS || 0;

            const totalExtrasItem = vIPI + vICMSST + freteRateado + seguroRateado + outrasRateado;
            const impostosUnit = item.qCom > 0 ? totalExtrasItem / item.qCom : 0;
            const descontoUnit = item.qCom > 0 ? descontoRateado / item.qCom : 0;
            
            const finalUnitCost = item.vUnCom + impostosUnit - descontoUnit;

            return {
                id: `${currentNfe.header.chave}-${index}`,
                cProd: item.cProd,
                description: item.xProd,
                quantity: item.qCom,
                originalUnitCost: item.vUnCom,
                impostosUnit: impostosUnit,
                descontoUnit: descontoUnit,
                finalUnitCost: finalUnitCost,
                fatorConversao: "1",
                margin: "",
                impostoSobreVenda: "",
                price: "",
                vIPI,
                vICMSST,
                vIBS,
                vCBS
            };
        });

        setItems(newItems);
        toast({
            title: "Tabela Preenchida",
            description: `${newItems.length} itens importados para precificação.`,
        });
    }, [currentNfe, toast]);

    const calculatePricing = useCallback((item: BatchPriceItem, field: string, value: string): BatchPriceItem => {
        const updatedItem = { ...item };
        
        if (field === 'margin') updatedItem.margin = value;
        if (field === 'price') updatedItem.price = value;
        if (field === 'impostoSobreVenda') updatedItem.impostoSobreVenda = value;
        if (field === 'fatorConversao') updatedItem.fatorConversao = value;

        const marginVal = parseFloat(updatedItem.margin) || 0;
        const priceVal = parseFloat(updatedItem.price) || 0;
        const taxVal = parseFloat(updatedItem.impostoSobreVenda) || 0;
        const factor = parseFloat(updatedItem.fatorConversao) || 1;
        
        const costPerSaleUnit = item.finalUnitCost / factor;

        if (costPerSaleUnit > 0) {
            if (field !== 'price') {
                const marginFactor = 1 + (marginVal / 100);
                const taxFactor = 1 - (taxVal / 100);
                if (taxFactor > 0) {
                    updatedItem.price = ((costPerSaleUnit * marginFactor) / taxFactor).toFixed(4);
                }
            } else if (field === 'price') {
                const taxFactor = 1 - (taxVal / 100);
                const actualRevenue = priceVal * taxFactor;
                updatedItem.margin = (((actualRevenue - costPerSaleUnit) / costPerSaleUnit) * 100).toFixed(2);
            }
        }

        return updatedItem;
    }, []);

    const handleItemChange = (id: string, field: string, value: string) => {
        setItems(prev => prev.map(item => item.id === id ? calculatePricing(item, field, value) : item));
    };

    const applyGlobalMargin = () => {
        if (!globalMargin) return;
        setItems(prev => prev.map(item => calculatePricing(item, 'margin', globalMargin)));
        toast({ title: "Margem Aplicada" });
    };

    const addItem = () => {
        const newItem: BatchPriceItem = {
            id: Math.random().toString(36).substr(2, 9),
            cProd: "",
            description: "Novo Item Manual",
            quantity: 1,
            originalUnitCost: 0,
            impostosUnit: 0,
            descontoUnit: 0,
            finalUnitCost: 0,
            fatorConversao: "1",
            margin: "",
            impostoSobreVenda: "",
            price: ""
        };
        setItems(prev => [...prev, newItem]);
    };

    const totals = useMemo(() => {
        const totalCost = items.reduce((acc, i) => acc + (i.quantity * i.finalUnitCost), 0);
        const totalSale = items.reduce((acc, i) => {
            const p = parseFloat(i.price) || 0;
            const f = parseFloat(i.fatorConversao) || 1;
            return acc + (i.quantity * f * p);
        }, 0);
        const avgMargin = totalCost > 0 ? ((totalSale - totalCost) / totalCost) * 100 : 0;
        return { totalCost, totalSale, avgMargin };
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(18);
        doc.text("Tabela de Precificação Estratégica", 14, 22);

        const head = [['Cód.', 'Descrição', 'Qtde', 'Fator', 'Custo Unit.', 'Margem', 'Preço Unit.', 'Venda Total']];
        const body = items.map(i => [
            i.cProd, i.description, formatNumber(i.quantity), i.fatorConversao,
            formatCurrency4(i.finalUnitCost), `${i.margin}%`, formatCurrency4(parseFloat(i.price) || 0),
            formatCurrency((parseFloat(i.price) || 0) * i.quantity * (parseFloat(i.fatorConversao) || 1))
        ]);

        autoTable(doc, {
            startY: 30, head, body, theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            foot: [['Totais:', '', '', '', '', '', '', formatCurrency(totals.totalSale)]],
            footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] }
        });

        doc.save(`precificacao_${currentNfe?.header.nNF || 'lote'}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Tag className="w-6 h-6 text-indigo-600" /> Formação de Preços em Lote
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Gestão de Margens e Markup Estratégico</p>
                </div>
                <div className="flex items-center gap-2">
                    <NfeUploader />
                </div>
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white dark:bg-slate-950 border-none shadow-xl rounded-2xl p-4">
                        <Label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Margem Global</Label>
                        <div className="flex gap-2">
                            <Input placeholder="%" value={globalMargin} onChange={e => setGlobalMargin(e.target.value)} className="h-10 font-black" />
                            <Button onClick={applyGlobalMargin} size="icon" className="shrink-0 bg-indigo-600">
                                <ChevronsRight size={18} />
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-slate-900 text-white border-none shadow-xl rounded-2xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400">Investimento Total</span>
                        <p className="text-xl font-black">{formatCurrency(totals.totalCost)}</p>
                    </Card>

                    <Card className="bg-indigo-600 text-white border-none shadow-xl rounded-2xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-white/60">Venda Total Prevista</span>
                        <p className="text-xl font-black">{formatCurrency(totals.totalSale)}</p>
                    </Card>

                    <Card className="bg-emerald-600 text-white border-none shadow-xl rounded-2xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-white/60">Margem Média Geral</span>
                        <p className="text-xl font-black">{formatNumber(totals.avgMargin)}%</p>
                    </Card>
                </div>
            )}

            {items.length > 0 && (
                <div className="rounded-2xl border shadow-2xl overflow-hidden bg-white dark:bg-slate-950">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead className="text-[10px] font-black uppercase text-slate-500">Item / Descrição</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Custo Final</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Fator</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-indigo-600">Margem %</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-rose-500">Imposto %</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-emerald-600">P. Venda</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Venda Total</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50 group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-[9px] font-black text-slate-400">{item.cProd || 'MANUAL'}</span>
                                            <span className="text-xs font-bold truncate max-w-[200px]">{item.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-bold text-slate-600">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger className="cursor-help border-b border-dotted">{formatCurrency4(item.finalUnitCost)}</TooltipTrigger>
                                                <TooltipContent className="p-3 rounded-xl border-none shadow-2xl bg-slate-900 text-white">
                                                    <div className="text-[10px] space-y-1">
                                                        <div className="flex justify-between gap-6"><span>IPI:</span> <span>{formatCurrency4(item.vIPI || 0)}</span></div>
                                                        <div className="flex justify-between gap-6"><span>ICMS-ST:</span> <span>{formatCurrency4(item.vICMSST || 0)}</span></div>
                                                        <div className="flex justify-between gap-6 text-emerald-400"><span>Desconto:</span> <span>-{formatCurrency4(item.descontoUnit || 0)}</span></div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.fatorConversao} onChange={e => handleItemChange(item.id, 'fatorConversao', e.target.value)} className="h-8 w-16 mx-auto text-center font-black text-xs" />
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.margin} onChange={e => handleItemChange(item.id, 'margin', e.target.value)} className="h-8 w-20 ml-auto text-right font-black text-xs bg-indigo-50 border-indigo-100" />
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.impostoSobreVenda} onChange={e => handleItemChange(item.id, 'impostoSobreVenda', e.target.value)} className="h-8 w-16 ml-auto text-right font-black text-xs bg-rose-50 border-rose-100 text-rose-600" />
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} className="h-8 w-24 ml-auto text-right font-black text-xs bg-emerald-50 border-emerald-100 text-emerald-700" />
                                    </TableCell>
                                    <TableCell className="text-right font-black text-xs text-slate-900">
                                        {formatCurrency((parseFloat(item.price) || 0) * item.quantity * (parseFloat(item.fatorConversao) || 1))}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {items.length > 0 && (
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                    <Button onClick={addItem} variant="outline" className="rounded-xl border-dashed">
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item Manual
                    </Button>
                    <Button onClick={generatePdf} className="bg-slate-900 text-white rounded-xl">
                        <Printer className="mr-2 h-4 w-4" /> Exportar Tabela Completa (PDF)
                    </Button>
                </div>
            )}

            {!items.length && (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-muted-foreground/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mb-4">
                        <Tag className="w-8 h-8 text-slate-400 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Precificação Estratégica</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">Importe uma NF-e para precificar todos os itens de uma só vez, aplicando margens e impostos sobre venda.</p>
                </div>
            )}
        </div>
    );
}
