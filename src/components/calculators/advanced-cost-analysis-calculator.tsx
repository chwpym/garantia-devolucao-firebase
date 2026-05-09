
'use client';

import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput, Styles } from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Info, Calculator, FileCheck, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Card, CardContent } from "@/components/ui/card";

type TaxRegime = 'lucro_real' | 'simples_nacional';

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
    pis: number;
    cofins: number;
    vIBS: number;
    vCBS: number;
    finalUnitCost: number;
    finalTotalCost: number;
    conversionFactor: string;
    convertedUnitCost: number;
}

export default function AdvancedCostAnalysisCalculator() {
    const { currentNfe } = useNfeStore();
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [manualFrete, setManualFrete] = useState("");
    const [manualSeguro, setManualSeguro] = useState("");
    const [manualOutros, setManualOutros] = useState("");
    const [manualDesconto, setManualDesconto] = useState("");
    const [useTaxReform, setUseTaxReform] = useState(false);
    const [taxRegime, setTaxRegime] = useState<TaxRegime>('lucro_real');
    const { toast } = useToast();

    // Sincroniza com a nota carregada no Store Global
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

        const newItems: AnalyzedItem[] = currentNfe.items.map((item, index) => {
            const itemWeight = totalProdFromXml > 0 ? item.vProd / totalProdFromXml : 0;

            // Rateio proporcional automático dos valores da nota se não estiverem discriminados no item
            const freteRateado = item.vFrete || (totalFrete * itemWeight);
            const seguroRateado = item.vSeg || (totalSeguro * itemWeight);
            const descontoRateado = item.vDesc || (totalDesconto * itemWeight);
            const outrasRateado = item.vOutro || (totalOutras * itemWeight);

            return {
                id: `${currentNfe.header.chave}-${index}`,
                cProd: item.cProd,
                description: item.xProd,
                quantity: item.qCom,
                unitCost: item.vUnCom,
                totalCost: item.vProd,
                ipi: item.taxes.vIPI || 0,
                icmsST: item.taxes.vICMSST || 0,
                frete: freteRateado,
                seguro: seguroRateado,
                desconto: descontoRateado,
                outras: outrasRateado,
                pis: item.taxes.vPIS || 0,
                cofins: item.taxes.vCOFINS || 0,
                vIBS: item.taxes.vIBS || 0,
                vCBS: item.taxes.vCBS || 0,
                finalUnitCost: 0, // Calculado no recalculate
                finalTotalCost: 0,
                conversionFactor: "1",
                convertedUnitCost: 0
            };
        });

        const calculated = recalculateCosts(newItems, taxRegime, useTaxReform);
        setItems(calculated);

        toast({
            title: "Itens Importados",
            description: `${newItems.length} produtos da NF-e ${currentNfe.header.nNF} carregados para análise.`,
        });
    }, [currentNfe]);

    const recalculateCosts = (currentItems: AnalyzedItem[], regime: TaxRegime, taxReform: boolean): AnalyzedItem[] => {
        return currentItems.map(item => {
            // Custo base: Valor Mercadoria + IPI + ST + Frete + Seguro + Outras - Desconto
            const baseTotalCost = item.totalCost + item.ipi + item.icmsST + item.frete + item.seguro + item.outras - item.desconto;
            
            // Na Reforma Tributária, IBS/CBS são somados ao custo se a reforma estiver ativa
            const taxReformValue = taxReform ? (item.vIBS + item.vCBS) : 0;
            let finalTotalCost = baseTotalCost + taxReformValue;

            // No Lucro Real, o PIS/COFINS (e IBS/CBS se reforma ativa) são créditos recuperáveis e devem ser subtraídos do custo
            if (regime === 'lucro_real') {
                finalTotalCost -= (item.pis + item.cofins);
                if (taxReform) {
                    finalTotalCost -= (item.vIBS + item.vCBS);
                }
            }

            const finalUnitCost = item.quantity > 0 ? finalTotalCost / item.quantity : 0;
            const factor = parseFloat(item.conversionFactor) || 1;
            const convertedUnitCost = factor > 0 ? finalUnitCost / factor : 0;

            return {
                ...item,
                finalTotalCost,
                finalUnitCost,
                convertedUnitCost,
            };
        });
    };

    const handleTaxRegimeChange = (value: string) => {
        const newRegime = value as TaxRegime;
        setTaxRegime(newRegime);
        setItems(prev => recalculateCosts(prev, newRegime, useTaxReform));
    };

    const toggleTaxReform = (checked: boolean) => {
        setUseTaxReform(checked);
        setItems(prev => recalculateCosts(prev, taxRegime, checked));
    };

    const applyManualRateio = () => {
        setItems(prev => {
            const totalProdValue = prev.reduce((acc, item) => acc + item.totalCost, 0);
            const mFrete = parseFloat(manualFrete) || 0;
            const mSeg = parseFloat(manualSeguro) || 0;
            const mOutros = parseFloat(manualOutros) || 0;
            const mDesc = parseFloat(manualDesconto) || 0;

            if (totalProdValue === 0 && (mFrete + mSeg + mOutros + mDesc) > 0) return prev;

            const updatedRaw = prev.map(item => {
                const itemWeight = totalProdValue > 0 ? item.totalCost / totalProdValue : 0;
                return {
                    ...item,
                    frete: manualFrete ? (mFrete * itemWeight) : item.frete,
                    seguro: manualSeguro ? (mSeg * itemWeight) : item.seguro,
                    outras: manualOutros ? (mOutros * itemWeight) : item.outras,
                    desconto: manualDesconto ? (mDesc * itemWeight) : item.desconto,
                };
            });
            return recalculateCosts(updatedRaw, taxRegime, useTaxReform);
        });
        toast({ title: "Rateio Aplicado", description: "Custos atualizados com novos valores globais." });
    };

    const handleConversionFactorChange = (id: string, value: string) => {
        setItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const factor = parseFloat(value) || 1;
                    const convertedUnitCost = factor > 0 ? item.finalUnitCost / factor : 0;
                    return { ...item, conversionFactor: value, convertedUnitCost };
                }
                return item;
            })
        );
    };

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.totalCost += item.totalCost;
            acc.totalIPI += item.ipi;
            acc.totalST += item.icmsST;
            acc.totalFrete += item.frete;
            acc.totalSeguro += item.seguro;
            acc.totalDesconto += item.desconto;
            acc.totalOutras += item.outras;
            acc.totalPIS += item.pis;
            acc.totalCOFINS += item.cofins;
            acc.finalTotalCost += item.finalTotalCost;
            return acc;
        }, {
            totalCost: 0, totalIPI: 0, totalST: 0, totalFrete: 0, totalSeguro: 0,
            totalDesconto: 0, totalOutras: 0, totalPIS: 0, totalCOFINS: 0, finalTotalCost: 0
        });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(18);
        doc.text("Análise de Custo Avançada por NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (currentNfe) {
            doc.setFontSize(10);
            const startY = 32;
            doc.text(`NF-e: ${currentNfe.header.nNF} | Chave: ${currentNfe.header.chave}`, 14, startY);
            doc.text(`Emitente: ${currentNfe.emit.xNome} | CNPJ: ${currentNfe.emit.CNPJ}`, 14, startY + 6);
            doc.text(`Regime: ${taxRegime === 'lucro_real' ? 'Lucro Real' : 'Simples Nacional'}`, doc.internal.pageSize.getWidth() - 14, startY, { align: "right" });
            doc.text(`Custo Total Líquido: ${formatCurrency(totals.finalTotalCost)}`, doc.internal.pageSize.getWidth() - 14, startY + 6, { align: "right" });
        }

        const head = [['Cód.', 'Descrição', 'Qtde', 'Fator', 'C. Un. Orig.', 'IPI', 'ST', 'Frete', 'Seguro', 'Outras', 'PIS/COF', 'C. Un. Final', 'C. Un. Final (Conv.)', 'C. Total Final']];
        const body = items.map(item => [
            item.cProd,
            item.description,
            formatNumber(item.quantity),
            item.conversionFactor,
            formatCurrency4(item.unitCost),
            formatCurrency(item.ipi),
            formatCurrency(item.icmsST),
            formatCurrency(item.frete),
            formatCurrency(item.seguro),
            formatCurrency(item.outras),
            formatCurrency(item.pis + item.cofins),
            formatCurrency4(item.finalUnitCost),
            formatCurrency4(item.convertedUnitCost),
            formatCurrency(item.finalTotalCost),
        ]);

        autoTable(doc, {
            startY: 48,
            head: head,
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            foot: [[
                { content: 'Totais:', colSpan: 11, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(totals.finalTotalCost), colSpan: 3, styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } }
            ]],
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.text(`Gerado via Synergia OS - ${new Date().toLocaleDateString()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`analise_custo_${currentNfe?.header.nNF || 'nfe'}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Padronizado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-primary" />
                        Análise Técnica de Custo Final
                    </h2>
                    <p className="text-xs text-muted-foreground">Cálculo profundo de custo unitário com rateio, impostos e créditos</p>
                </div>
                <NfeUploader />
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Painel de Configuração */}
                    <Card className="lg:col-span-1 shadow-md border-primary/10">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <FileCheck className="w-4 h-4 text-primary" />
                                        Configurações de Imposto
                                    </Label>
                                    <Select onValueChange={handleTaxRegimeChange} value={taxRegime}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lucro_real">Lucro Real (C/ Crédito)</SelectItem>
                                            <SelectItem value="simples_nacional">Simples Nacional (S/ Crédito)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="tax-reform" className="text-sm font-bold cursor-pointer">Simular Reforma Tributária</Label>
                                        <p className="text-[10px] text-muted-foreground">Aplica IBS/CBS (novas regras)</p>
                                    </div>
                                    <Switch id="tax-reform" checked={useTaxReform} onCheckedChange={toggleTaxReform} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" />
                                    Rateio Manual Extra
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Frete Extra</Label>
                                        <Input placeholder="R$ 0,00" value={manualFrete} onChange={e => setManualFrete(e.target.value)} className="h-9 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Outros Custos</Label>
                                        <Input placeholder="R$ 0,00" value={manualOutros} onChange={e => setManualOutros(e.target.value)} className="h-9 font-mono" />
                                    </div>
                                </div>
                                <Button onClick={applyManualRateio} variant="outline" className="w-full h-10 border-primary/20 text-primary hover:bg-primary/5">
                                    Aplicar Rateio aos Itens
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resumo de Totais */}
                    <Card className="lg:col-span-2 shadow-md border-primary/10 bg-primary/[0.02]">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Mercadorias</span>
                                    <p className="text-lg font-bold">{formatCurrency(totals.totalCost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Impostos Somados</span>
                                    <p className="text-lg font-bold text-destructive">{formatCurrency(totals.totalIPI + totals.totalST)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Créditos (PIS/COF)</span>
                                    <p className="text-lg font-bold text-emerald-600">-{formatCurrency(taxRegime === 'lucro_real' ? totals.totalPIS + totals.totalCOFINS : 0)}</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                    <span className="text-[10px] uppercase font-bold text-primary">Custo Final Líquido</span>
                                    <p className="text-xl font-black text-primary">{formatCurrency(totals.finalTotalCost)}</p>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button onClick={generatePdf} className="h-11 shadow-lg bg-primary hover:bg-primary/90">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Gerar Relatório Técnico PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {items.length > 0 && (
                <div className="rounded-xl border shadow-lg overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[120px] text-xs font-bold">Cód. Forn.</TableHead>
                                    <TableHead className="min-w-[250px] text-xs font-bold">Descrição do Produto</TableHead>
                                    <TableHead className="text-right text-xs font-bold">Qtde</TableHead>
                                    <TableHead className="w-[100px] text-xs font-bold">Fator Conv.</TableHead>
                                    <TableHead className="text-right text-xs font-bold">Custo Orig.</TableHead>
                                    <TableHead className="text-right text-xs font-bold">IPI/ST</TableHead>
                                    <TableHead className="text-right text-xs font-bold">Despesas</TableHead>
                                    <TableHead className="text-right text-xs font-bold text-emerald-600">Créditos</TableHead>
                                    <TableHead className="text-right text-xs font-bold text-primary">C. Un. Final</TableHead>
                                    <TableHead className="text-right text-xs font-bold text-third">C. Un. Conv.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                                        <TableCell className="font-mono text-[11px] font-bold text-primary">{item.cProd}</TableCell>
                                        <TableCell className="text-xs">{item.description}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{formatNumber(item.quantity)}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                className="h-8 text-right font-mono text-xs focus-visible:ring-primary"
                                                value={item.conversionFactor}
                                                onChange={(e) => handleConversionFactorChange(item.id, e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">{formatCurrency4(item.unitCost)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-destructive">{formatCurrency(item.ipi + item.icmsST)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{formatCurrency(item.frete + item.seguro + item.outras - item.desconto)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs text-emerald-600">
                                            {taxRegime === 'lucro_real' ? formatCurrency(item.pis + item.cofins + (useTaxReform ? item.vIBS + item.vCBS : 0)) : 'R$ 0,00'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs font-black text-primary">{formatCurrency4(item.finalUnitCost)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs font-black text-third">{formatCurrency4(item.convertedUnitCost)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {!currentNfe && (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/20 border-muted-foreground/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Calculator className="w-8 h-8 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-bold text-muted-foreground">Nenhuma NF-e carregada</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">Carregue um arquivo XML para iniciar a análise técnica de custos</p>
                </div>
            )}
        </div>
    );
}

