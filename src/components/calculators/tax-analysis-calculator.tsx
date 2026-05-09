
'use client';

import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck, FileText, Landmark, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4 } from "@/lib/utils";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyzedTaxItem {
    id: string;
    cProd: string;
    description: string;
    ncm: string;
    cst: string;
    cfop: string;
    quantity: number;
    totalCost: number;
    icms: { value: number; rate: number };
    ipi: { value: number; rate: number };
    pis: { value: number; rate: number };
    cofins: { value: number; rate: number };
    st: number;
    ibs: { value: number; rate: number };
    cbs: { value: number; rate: number };
}

export default function TaxAnalysisCalculator() {
    const { currentNfe } = useNfeStore();
    const [items, setItems] = useState<AnalyzedTaxItem[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (!currentNfe) {
            setItems([]);
            return;
        }

        const newItems: AnalyzedTaxItem[] = currentNfe.items.map((item, index) => {
            return {
                id: `${currentNfe.header.chave}-${index}`,
                cProd: item.cProd,
                description: item.xProd,
                ncm: item.NCM || "",
                cst: item.CST || "",
                cfop: item.CFOP || "",
                quantity: item.qCom,
                totalCost: item.vProd,
                icms: { value: item.taxes.vICMS || 0, rate: item.taxes.pICMS || 0 },
                ipi: { value: item.taxes.vIPI || 0, rate: item.taxes.pIPI || 0 },
                pis: { value: item.taxes.vPIS || 0, rate: item.taxes.pPIS || 0 },
                cofins: { value: item.taxes.vCOFINS || 0, rate: item.taxes.pCOFINS || 0 },
                st: item.taxes.vICMSST || 0,
                ibs: { value: item.taxes.vIBS || 0, rate: item.taxes.pIBS || 0 },
                cbs: { value: item.taxes.vCBS || 0, rate: item.taxes.pCBS || 0 },
            };
        });

        setItems(newItems);
        toast({
            title: "Auditoria Fiscal Concluída",
            description: `${newItems.length} itens analisados com sucesso.`,
        });
    }, [currentNfe, toast]);

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.totalCost += item.totalCost;
            acc.icms += item.icms.value;
            acc.st += item.st;
            acc.ipi += item.ipi.value;
            acc.pis += item.pis.value;
            acc.cofins += item.cofins.value;
            acc.ibs += item.ibs.value;
            acc.cbs += item.cbs.value;
            return acc;
        }, { totalCost: 0, icms: 0, st: 0, ipi: 0, pis: 0, cofins: 0, ibs: 0, cbs: 0 });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(18);
        doc.text("Auditoria de Tributos da NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (currentNfe) {
            doc.setFontSize(10);
            doc.text(`NF-e: ${currentNfe.header.nNF || 'S/N'} | Chave: ${currentNfe.header.chave}`, 14, 32);
            doc.text(`Fornecedor: ${currentNfe.emit.xNome}`, 14, 38);
        }

        const head = [['Cód.', 'Descrição', 'NCM', 'CST', 'Total', 'ICMS', 'ST', 'IPI', 'PIS/COFINS', 'IBS/CBS']];
        const body = items.map(i => [
            i.cProd,
            i.description,
            i.ncm,
            i.cst,
            formatCurrency(i.totalCost),
            `${formatCurrency(i.icms.value)} (${i.icms.rate}%)`,
            formatCurrency(i.st),
            formatCurrency(i.ipi.value),
            formatCurrency(i.pis.value + i.cofins.value),
            formatCurrency(i.ibs.value + i.cbs.value)
        ]);

        autoTable(doc, {
            startY: 45,
            head,
            body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            foot: [[
                { content: 'TOTAIS FISCAIS', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCost), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.icms), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.st), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.ipi), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.pis + totals.cofins), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.ibs + totals.cbs), styles: { fontStyle: 'bold' } }
            ]]
        });

        doc.save(`auditoria_fiscal_${currentNfe?.header.nNF || 'manual'}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Padronizado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Auditoria Fiscal de Entrada
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-black opacity-70">Análise de Impostos e Reforma Tributária</p>
                </div>
                <NfeUploader />
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <Card className="bg-card text-foreground shadow-lg border border-border overflow-hidden relative">
                        <CardContent className="p-4 space-y-1">
                            <span className="text-[10px] font-black uppercase opacity-60">Total ICMS + ST</span>
                            <p className="text-2xl font-black text-primary">{formatCurrency(totals.icms + totals.st)}</p>
                        </CardContent>
                    </Card>
 
                    <Card className="bg-card text-foreground shadow-lg border border-border overflow-hidden relative">
                        <CardContent className="p-4 space-y-1">
                            <span className="text-[10px] font-black uppercase opacity-60">Total IPI</span>
                            <p className="text-2xl font-black text-destructive">{formatCurrency(totals.ipi)}</p>
                        </CardContent>
                    </Card>
 
                    <Card className="bg-card text-foreground shadow-lg border border-border overflow-hidden relative">
                        <CardContent className="p-4 space-y-1">
                            <span className="text-[10px] font-black uppercase opacity-60">PIS / COFINS Total</span>
                            <p className="text-2xl font-black text-accent-green">{formatCurrency(totals.pis + totals.cofins)}</p>
                        </CardContent>
                    </Card>

                     <Card className="bg-primary text-primary-foreground shadow-lg border-none overflow-hidden relative">
                        <div className="absolute right-[-5px] top-[-5px] opacity-10">
                            <Landmark size={60} />
                        </div>
                        <CardContent className="p-4 space-y-1">
                            <span className="text-[10px] font-black uppercase opacity-80">IBS / CBS (Reforma)</span>
                            <p className="text-2xl font-black">{formatCurrency(totals.ibs + totals.cbs)}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {items.length > 0 && (
                <div className="flex justify-end">
                    <Button onClick={generatePdf} variant="outline" className="shadow-sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Exportar Relatório Fiscal
                    </Button>
                </div>
            )}

            {items.length > 0 ? (
                <div className="rounded-xl border border-border shadow-xl overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted">
                                    <TableHead className="w-[120px] text-[10px] font-black uppercase text-muted-foreground">Cód. Forn.</TableHead>
                                    <TableHead className="min-w-[200px] text-[10px] font-black uppercase text-muted-foreground">Descrição</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-muted-foreground">NCM / CST</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground">Total Item</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-primary">ICMS</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-primary">ST</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-destructive">IPI</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-accent-green">PIS/COF</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-primary">IBS/CBS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-accent/5 transition-colors">
                                        <TableCell className="font-mono text-[10px] font-black text-muted-foreground">{item.cProd}</TableCell>
                                        <TableCell className="text-xs font-black text-foreground truncate max-w-[250px]">{item.description}</TableCell>
                                         <TableCell className="text-center">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-mono font-black text-muted-foreground opacity-50">{item.ncm}</span>
                                                <Badge variant="outline" className="text-[9px] h-4 px-1 mx-auto font-black border-border">{item.cst}</Badge>
                                            </div>
                                        </TableCell>
                                         <TableCell className="text-right text-xs font-mono font-black">{formatCurrency(item.totalCost)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-primary">{formatCurrency(item.icms.value)}</span>
                                                <span className="text-[9px] text-muted-foreground font-bold">{item.icms.rate}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-primary">{formatCurrency(item.st)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-rose-600">{formatCurrency(item.ipi.value)}</span>
                                                <span className="text-[9px] text-muted-foreground">{item.ipi.rate}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="text-xs font-black text-accent-green underline decoration-dotted">
                                                        {formatCurrency(item.pis.value + item.cofins.value)}
                                                    </TooltipTrigger>
                                                    <TooltipContent className="p-2 text-[10px] space-y-1">
                                                        <div className="flex justify-between gap-4 font-black"><span>PIS ({item.pis.rate}%):</span> <span>{formatCurrency(item.pis.value)}</span></div>
                                                        <div className="flex justify-between gap-4 font-black"><span>COFINS ({item.cofins.rate}%):</span> <span>{formatCurrency(item.cofins.value)}</span></div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-primary">{formatCurrency(item.ibs.value + item.cbs.value)}</span>
                                                <span className="text-[9px] text-primary opacity-70 font-black">Σ {item.ibs.rate + item.cbs.rate}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                             <TableFooter className="bg-foreground text-background">
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4} className="text-right text-[10px] font-black uppercase opacity-60">Carga Tributária Total:</TableCell>
                                    <TableCell className="text-right text-xs font-black text-background">{formatCurrency(totals.icms)}</TableCell>
                                    <TableCell className="text-right text-xs font-black text-background">{formatCurrency(totals.st)}</TableCell>
                                    <TableCell className="text-right text-xs font-black text-background">{formatCurrency(totals.ipi)}</TableCell>
                                    <TableCell className="text-right text-xs font-black text-background">{formatCurrency(totals.pis + totals.cofins)}</TableCell>
                                    <TableCell className="text-right text-xs font-black text-background">{formatCurrency(totals.ibs + totals.cbs)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-border text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Aguardando Documento XML</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 font-medium">Importe o XML para realizar uma auditoria completa de impostos e visualizar o impacto da Reforma Tributária.</p>
                </div>
            )}
        </div>
    );
}






