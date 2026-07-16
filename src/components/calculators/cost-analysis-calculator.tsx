
'use client';

import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Calculator, FileText, ArrowDownToLine, RefreshCw, Info, PieChart, TrendingDown, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4 } from "@/lib/utils";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyzedItem {
    id: string;
    cProd: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    ipi: number;
    icmsST: number;
    frete: number;
    seguro: number;
    desconto: number;
    outras: number;
    vIBS: number;
    vCBS: number;
    conversionFactor: string;
    finalUnitCost: number;
    finalTotalCost: number;
    convertedUnitCost: number;
}

export default function CostAnalysisCalculator() {
    const { currentNfe } = useNfeStore();
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [useTaxReform, setUseTaxReform] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!currentNfe) {
            setItems([]);
            return;
        }

        const totalProdXml = currentNfe.totals.vProd || 0;
        const totalFrete = currentNfe.totals.vFrete || 0;
        const totalSeguro = currentNfe.totals.vSeg || 0;
        const totalDesconto = currentNfe.totals.vDesc || 0;
        const totalOutras = currentNfe.totals.vOutro || 0;

        const newItems: AnalyzedItem[] = currentNfe.items.map((item, index) => {
            const itemWeight = totalProdXml > 0 ? item.vProd / totalProdXml : 0;
            
            const freteRateado = item.vFrete || (totalFrete * itemWeight);
            const seguroRateado = item.vSeg || (totalSeguro * itemWeight);
            const outrasRateado = item.vOutro || (totalOutras * itemWeight);
            const descontoRateado = item.vDesc || (totalDesconto * itemWeight);

            const ipi = item.taxes.vIPI || 0;
            const icmsST = item.taxes.vICMSST || 0;
            const vIBS = item.taxes.vIBS || 0;
            const vCBS = item.taxes.vCBS || 0;

            const extras = ipi + icmsST + freteRateado + seguroRateado + outrasRateado;
            const taxReformValue = useTaxReform ? (vIBS + vCBS) : 0;
            
            const finalTotalCost = item.vProd + extras + taxReformValue - descontoRateado;
            const finalUnitCost = item.qCom > 0 ? finalTotalCost / item.qCom : 0;

            return {
                id: `${currentNfe.header.chave}-${index}`,
                cProd: item.cProd,
                description: item.xProd,
                quantity: item.qCom,
                unitCost: item.vUnCom,
                totalCost: item.vProd,
                ipi,
                icmsST,
                frete: freteRateado,
                seguro: seguroRateado,
                desconto: descontoRateado,
                outras: outrasRateado,
                vIBS,
                vCBS,
                conversionFactor: "1",
                finalUnitCost,
                finalTotalCost,
                convertedUnitCost: finalUnitCost
            };
        });

        setItems(newItems);
        toast({
            title: "NF-e Analisada",
            description: `${newItems.length} itens processados com sucesso.`,
        });
    }, [currentNfe, useTaxReform, toast]);

    const handleFactorChange = (id: string, value: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const factor = parseFloat(value) || 1;
                return { 
                    ...item, 
                    conversionFactor: value, 
                    convertedUnitCost: factor > 0 ? item.finalUnitCost / factor : 0 
                };
            }
            return item;
        }));
    };

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.totalCost += item.totalCost;
            acc.totalExtras += (item.ipi + item.icmsST + item.frete + item.seguro + item.outras + (useTaxReform ? (item.vIBS + item.vCBS) : 0));
            acc.totalDesconto += item.desconto;
            acc.finalTotal += item.finalTotalCost;
            return acc;
        }, { totalCost: 0, totalExtras: 0, totalDesconto: 0, finalTotal: 0 });
    }, [items, useTaxReform]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(18);
        doc.text("Relatório de Análise de Custo de Entrada", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        const head = [['Cód.', 'Descrição', 'Qtde', 'Fator', 'C. Unit. Orig.', 'Encargos', 'Desc.', 'C. Unit. Final', 'Invest. Total']];
        const body = items.map(i => [
            i.cProd, i.description, formatNumber(i.quantity), i.conversionFactor,
            formatCurrency4(i.unitCost), formatCurrency4(i.ipi + i.icmsST + i.frete + i.seguro + i.outras + (useTaxReform ? (i.vIBS + i.vCBS) : 0)),
            formatCurrency4(i.desconto), formatCurrency4(i.finalUnitCost), formatCurrency(i.finalTotalCost)
        ]);

        autoTable(doc, {
            startY: 35, head, body, theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            foot: [['TOTAIS', '', '', '', '', '', '', '', formatCurrency(totals.finalTotal)]],
            footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] }
        });

        doc.save(`analise_custo_${currentNfe?.header.nNF || 'lote'}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
                        <PieChart className="w-6 h-6 text-primary" /> Análise de Custo
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase font-black tracking-wider opacity-70">Descomposição de Encargos e Rateio de NF-e</p>
                </div>
                <NfeUploader />
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <Card className="bg-card text-foreground border border-border shadow-xl rounded-2xl p-5 overflow-hidden relative group">
                        <div className="absolute right-[-10px] top-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                            <DollarSign size={80} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Custo Mercadoria</span>
                        <p className="text-2xl font-black text-foreground">{formatCurrency(totals.totalCost)}</p>
                    </Card>

                     <Card className="bg-destructive text-destructive-foreground border-none shadow-xl rounded-2xl p-5 overflow-hidden relative">
                        <span className="text-[10px] font-black uppercase opacity-70 block mb-1">Encargos (+)</span>
                        <p className="text-2xl font-black">{formatCurrency(totals.totalExtras)}</p>
                    </Card>
 
                    <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-2xl p-5 overflow-hidden relative">
                        <span className="text-[10px] font-black uppercase opacity-70 block mb-1">Descontos (-)</span>
                        <p className="text-2xl font-black">{formatCurrency(totals.totalDesconto)}</p>
                    </Card>
 
                    <Card className="bg-accent-green text-background border-none shadow-xl rounded-2xl p-5 overflow-hidden relative">
                        <span className="text-[10px] font-black uppercase opacity-70 block mb-1">Custo Real Final</span>
                        <p className="text-2xl font-black">{formatCurrency(totals.finalTotal)}</p>
                    </Card>
                </div>
            )}

            {items.length > 0 && (
                 <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Switch id="tax-reform-basic" checked={useTaxReform} onCheckedChange={setUseTaxReform} />
                        <Label htmlFor="tax-reform-basic" className="text-sm font-black cursor-pointer uppercase tracking-tighter">Simular Reforma (IBS/CBS)</Label>
                    </div>
                    <div className="md:ml-auto flex gap-3">
                        <Button onClick={generatePdf} variant="outline" className="rounded-xl font-black h-10 border-border">
                            <Printer className="mr-2 h-4 w-4" /> Exportar Relatório
                        </Button>
                    </div>
                </div>
            )}

            {items.length > 0 ? (
                <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted border-none">
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Cód / Produto</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground">Qtde</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-muted-foreground">Fator</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground">Custo NF</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-destructive">Encargos (+)</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-primary">C. Un. Final</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-accent-green">Invest. Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-accent/5 transition-colors border-border">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[9px] font-black text-primary">{item.cProd}</span>
                                                <span className="text-xs font-black text-foreground truncate max-w-[250px]">{item.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs font-bold">{formatNumber(item.quantity)}</TableCell>
                                        <TableCell>
                                            <Input 
                                                value={item.conversionFactor} 
                                                onChange={e => handleFactorChange(item.id, e.target.value)}
                                                className="h-8 w-16 mx-auto text-center font-black text-xs bg-background border-border"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs font-black text-muted-foreground">{formatCurrency4(item.unitCost)}</TableCell>
                                        <TableCell className="text-right">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="text-xs font-black text-rose-600 border-b border-dotted border-rose-200">
                                                        {formatCurrency4(item.ipi + item.icmsST + item.frete + item.seguro + item.outras + (useTaxReform ? (item.vIBS + item.vCBS) : 0))}
                                                    </TooltipTrigger>
                                                    <TooltipContent className="p-4 rounded-2xl border-none shadow-2xl bg-slate-900 text-white w-64">
                                                        <div className="space-y-2 text-[10px]">
                                                            <p className="font-black border-b border-white/10 pb-1 uppercase tracking-wider">Composição de Encargos</p>
                                                            <div className="flex justify-between"><span>IPI / ICMS-ST:</span> <span>{formatCurrency4(item.ipi + item.icmsST)}</span></div>
                                                            <div className="flex justify-between"><span>Frete / Seguro:</span> <span>{formatCurrency4(item.frete + item.seguro)}</span></div>
                                                            <div className="flex justify-between"><span>Outras Despesas:</span> <span>{formatCurrency4(item.outras)}</span></div>
                                                            {useTaxReform && (
                                                                <div className="flex justify-between text-indigo-400 font-bold border-t border-white/10 pt-1">
                                                                    <span>IBS/CBS (Reforma):</span> <span>{formatCurrency4(item.vIBS + item.vCBS)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-primary">{formatCurrency4(item.finalUnitCost)}</span>
                                                {parseFloat(item.conversionFactor) !== 1 && (
                                                    <span className="text-[9px] text-muted-foreground font-bold italic">Un. Conv: {formatCurrency4(item.convertedUnitCost)}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-accent-green">{formatCurrency(item.finalTotalCost)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-muted-foreground/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-400 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Análise de Custo por Item</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">Carregue um XML para decompor o custo de cada produto, considerando todos os impostos e taxas da nota.</p>
                </div>
            )}
        </div>
    );
}
