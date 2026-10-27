'use client';

import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Calculator, FileCheck, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4 } from "@/lib/utils";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Card, CardContent } from "@/components/ui/card";

type TaxRegime = 'lucro_real' | 'simples_nacional';

interface AnalyzedItem {
    id: string;
    nItem: number;
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
    const [taxRegime, setTaxRegime] = useState<TaxRegime>('simples_nacional');
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

        const newItems: AnalyzedItem[] = currentNfe.items.map((item, index) => {
            const itemWeight = totalProdFromXml > 0 ? item.vProd / totalProdFromXml : 0;

            const freteRateado = item.vFrete || (totalFrete * itemWeight);
            const seguroRateado = item.vSeg || (totalSeguro * itemWeight);
            const descontoRateado = item.vDesc || (totalDesconto * itemWeight);
            const outrasRateado = item.vOutro || (totalOutras * itemWeight);

            return {
                id: `${currentNfe.header.chave}-${index}`,
                nItem: item.nItem || (index + 1),
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
                finalUnitCost: 0,
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
            const baseTotalCost = item.totalCost + item.ipi + item.icmsST + item.frete + item.seguro + item.outras - item.desconto;
            const taxReformValue = taxReform ? (item.vIBS + item.vCBS) : 0;
            let finalTotalCost = baseTotalCost + taxReformValue;

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

    const totalCreditAmount = taxRegime === 'lucro_real' ? totals.totalPIS + totals.totalCOFINS : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Padronizado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-primary" />
                        Análise Técnica Pro
                    </h2>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider opacity-70">Cálculo profundo de custo unitário com rateio, impostos e créditos</p>
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
                                    <Label className="text-sm font-semibold flex items-center gap-2">
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
                                        <Label htmlFor="tax-reform" className="text-sm font-semibold cursor-pointer">Simular Reforma Tributária</Label>
                                        <p className="text-xs text-muted-foreground">Em 2026 o destaque é informativo. Ative p/ projetar IBS/CBS no custo.</p>
                                    </div>
                                    <Switch id="tax-reform" checked={useTaxReform} onCheckedChange={toggleTaxReform} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" />
                                    Rateio Manual Extra
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase text-muted-foreground font-semibold">Frete Extra</Label>
                                        <Input placeholder="R$ 0,00" value={manualFrete} onChange={e => setManualFrete(e.target.value)} className="h-9 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase text-muted-foreground font-semibold">Outros Custos</Label>
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
                                    <span className="text-xs uppercase font-semibold text-muted-foreground">Total Mercadorias</span>
                                    <p className="text-lg font-semibold text-foreground">{formatCurrency(totals.totalCost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs uppercase font-semibold text-muted-foreground">Impostos Somados (+)</span>
                                    <p className={(totals.totalIPI + totals.totalST) > 0 ? "text-lg font-semibold text-destructive" : "text-lg font-semibold text-muted-foreground"}>{formatCurrency(totals.totalIPI + totals.totalST)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs uppercase font-semibold text-muted-foreground">Créditos (PIS/COF)</span>
                                    <p className={totalCreditAmount > 0 ? "text-lg font-semibold text-accent-green" : "text-lg font-semibold text-muted-foreground"}>-{formatCurrency(totalCreditAmount)}</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-lg bg-primary/10 border border-primary/20 shadow-inner">
                                    <span className="text-xs uppercase font-semibold text-primary opacity-80">Custo Final Líquido</span>
                                    <p className="text-xl font-semibold text-primary">{formatCurrency(totals.finalTotalCost)}</p>
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
                                    <TableHead className="w-[140px] text-xs font-semibold text-muted-foreground"># XML / Cód.</TableHead>
                                    <TableHead className="min-w-[250px] text-xs font-semibold text-muted-foreground">Descrição do Produto</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Qtde</TableHead>
                                    <TableHead className="w-[100px] text-xs font-semibold text-muted-foreground">Fator Conv.</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Custo Orig.</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">IPI/ST (+)</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Despesas</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Créditos (-)</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-primary">C. Un. Final</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-foreground opacity-70">C. Un. Conv.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => {
                                    const itemIpiSt = item.ipi + item.icmsST;
                                    const itemDespesas = item.frete + item.seguro + item.outras - item.desconto;
                                    const itemCredit = taxRegime === 'lucro_real' ? item.pis + item.cofins + (useTaxReform ? item.vIBS + item.vCBS : 0) : 0;
                                    return (
                                        <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                                            <TableCell className="font-mono text-xs font-semibold text-primary"><div className="flex items-center gap-1.5"><Badge variant="outline" className="h-4 px-1 font-mono text-xs font-semibold border-primary/30 text-primary shrink-0">#{item.nItem}</Badge><span className="truncate">{item.cProd}</span></div></TableCell>
                                            <TableCell className="text-xs font-semibold text-foreground">{item.description}</TableCell>
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
                                            <TableCell className={itemIpiSt > 0 ? "text-right font-mono text-xs font-semibold text-destructive" : "text-right font-mono text-xs text-muted-foreground/60"}>{formatCurrency(itemIpiSt)}</TableCell>
                                            <TableCell className={itemDespesas !== 0 ? "text-right font-mono text-xs" : "text-right font-mono text-xs text-muted-foreground/60"}>{formatCurrency(itemDespesas)}</TableCell>
                                            <TableCell className={itemCredit > 0 ? "text-right font-mono text-xs text-accent-green font-semibold" : "text-right font-mono text-xs text-muted-foreground/60"}>
                                                {formatCurrency(itemCredit)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs font-semibold text-primary">{formatCurrency4(item.finalUnitCost)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-semibold text-foreground opacity-70">{formatCurrency4(item.convertedUnitCost)}</TableCell>
                                        </TableRow>
                                    );
                                })}
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
                    <h3 className="text-lg font-semibold text-muted-foreground">Nenhuma NF-e carregada</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-xs mt-1">Carregue um arquivo XML no topo da página para iniciar os cálculos automáticos.</p>
                </div>
            )}
        </div>
    );
}
