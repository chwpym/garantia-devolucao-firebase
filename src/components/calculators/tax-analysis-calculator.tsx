
/* No changes needed here, just adding a comment to facilitate replacement if it fails. */
"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { useNfeParser, type NfeData, type NfeInfo as NfeParserInfo, type NfeProductDetail } from "@/hooks/use-nfe-parser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AnalyzedItem {
    id: number;
    description: string;
    ncm: string;
    cst: string;
    cfop: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    icms: number;
    pIcms: number;
    icmsSt: number;
    ipi: number;
    pIpi: number;
    pis: number;
    pPis: number;
    cofins: number;
    pCofins: number;
    vIbs: number;
    pIbs: number;
    vCbs: number;
    pCbs: number;
}

interface NfeInfo extends NfeParserInfo {
    totalIcms: number;
    totalIcmsSt: number;
    totalIpi: number;
    totalPis: number;
    totalCofins: number;
    totalNf: number;
    totalIbs?: number;
    totalCbs?: number;
}

export default function TaxAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const { toast } = useToast();

    const onNfeProcessed = (data: NfeData | null) => {
        if (!data) {
            setItems([]);
            setNfeInfo(null);
            return;
        }

        const { infNFe, det: dets } = data;
        const total = infNFe.total.ICMSTot;
        const totalIBSCBS = infNFe.total.IBSCBSTot;

        const newNfeInfo: NfeInfo = {
            emitterName: infNFe.emit.xNome,
            emitterCnpj: infNFe.emit.CNPJ,
            nfeNumber: infNFe.ide.nNF,
            totalIcms: parseFloat(total.vICMS) || 0,
            totalIcmsSt: parseFloat(total.vST) || 0,
            totalIpi: parseFloat(total.vIPI) || 0,
            totalPis: parseFloat(total.vPIS) || 0,
            totalCofins: parseFloat(total.vCOFINS) || 0,
            totalNf: parseFloat(total.vNF) || 0,
            totalIbs: parseFloat(totalIBSCBS?.vIBS?.toString() || "0") || 0,
            totalCbs: parseFloat(totalIBSCBS?.vCBS?.toString() || "0") || 0,
        };
        setNfeInfo(newNfeInfo);

        const extractST = (imposto: any): number => {
            if (!imposto?.ICMS) return 0;
            const icms = imposto.ICMS;
            for (const key in icms) {
                if (icms[key]?.vICMSST) return parseFloat(icms[key].vICMSST) || 0;
            }
            return 0;
        };

        const extractCST = (imposto: any): string => {
            if (!imposto?.ICMS) return "";
            const icms = imposto.ICMS;
            for (const key in icms) {
                if (icms[key]?.CST) return icms[key].CST;
                if (icms[key]?.CSOSN) return icms[key].CSOSN;
            }
            return "";
        };

        const newItems: AnalyzedItem[] = dets.map((det: NfeProductDetail, index: number) => {
            const prod = det.prod;
            const imposto = det.imposto;

            const ibscbs = imposto?.IBSCBS?.gIBSCBS as any;

            return {
                id: index,
                description: prod.xProd || "",
                ncm: prod.NCM || "",
                cst: extractCST(imposto),
                cfop: prod.CFOP || "",
                quantity: parseFloat(prod.qCom) || 0,
                unitCost: parseFloat(prod.vUnCom) || 0,
                totalCost: parseFloat(prod.vProd) || 0,
                icms: parseFloat(imposto?.ICMS?.vICMS?.toString() || "0") || 0,
                pIcms: parseFloat(imposto?.ICMS?.pICMS?.toString() || "0") || 0,
                icmsSt: extractST(imposto),
                ipi: parseFloat(imposto?.IPI?.IPITrib?.vIPI?.toString() || "0") || 0,
                pIpi: parseFloat(imposto?.IPI?.IPITrib?.pIPI?.toString() || "0") || 0,
                pis: parseFloat(imposto?.PIS?.PISAliq?.vPIS?.toString() || "0") || 0,
                pPis: parseFloat(imposto?.PIS?.PISAliq?.pPIS?.toString() || "0") || 0,
                cofins: parseFloat(imposto?.COFINS?.COFINSAliq?.vCOFINS?.toString() || "0") || 0,
                pCofins: parseFloat(imposto?.COFINS?.COFINSAliq?.pCOFINS?.toString() || "0") || 0,
                vIbs: parseFloat(ibscbs?.vIBS?.toString() || "0") || 0,
                pIbs: parseFloat(ibscbs?.pIBS?.toString() || "0") || 0,
                vCbs: parseFloat(ibscbs?.gCBS?.vCBS?.toString() || "0") || 0,
                pCbs: parseFloat(ibscbs?.gCBS?.pCBS?.toString() || "0") || 0,
            };
        });

        setItems(newItems);
        toast({ title: "Sucesso!", description: `${newItems.length} itens importados e analisados.` });
    };

    const { fileName, handleFileChange, clearNfeData, fileInputRef } = useNfeParser({ onNfeProcessed });

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.totalCost += item.totalCost;
            acc.totalIcms += item.icms;
            acc.totalIcmsSt += item.icmsSt;
            acc.totalIpi += item.ipi;
            acc.totalPis += item.pis;
            acc.totalCofins += item.cofins;
            acc.totalIbs += item.vIbs;
            acc.totalCbs += item.vCbs;
            return acc;
        }, {
            totalCost: 0, totalIcms: 0, totalIcmsSt: 0, totalIpi: 0, totalPis: 0, totalCofins: 0, totalIbs: 0, totalCbs: 0
        });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(18);
        doc.text("Análise Fiscal por NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (nfeInfo) {
            doc.setFontSize(10);
            const startY = 32;
            doc.text(`NF-e: ${nfeInfo.nfeNumber}`, 14, startY);
            doc.text(`Emitente: ${nfeInfo.emitterName}`, 14, startY + 6);
            doc.text(`CNPJ: ${nfeInfo.emitterCnpj}`, 14, startY + 12);
            doc.text(`Valor Total NF-e: ${formatCurrency(nfeInfo.totalNf)}`, doc.internal.pageSize.getWidth() - 14, startY, { align: "right" });
        }

        const head = [['Descrição', 'NCM', 'CST', 'CFOP', 'Qtde', 'Total', 'ICMS', 'ST', 'IPI', 'PIS', 'COFINS', 'IBS', 'CBS']];
        const body = items.map(item => [
            item.description,
            item.ncm,
            item.cst,
            item.cfop,
            formatNumber4(item.quantity),
            formatCurrency(item.totalCost),
            formatCurrency(item.icms),
            formatCurrency(item.icmsSt),
            formatCurrency(item.ipi),
            formatCurrency(item.pis),
            formatCurrency(item.cofins),
            formatCurrency(item.vIbs),
            formatCurrency(item.vCbs),
        ]);

        autoTable(doc, {
            startY: nfeInfo ? 54 : 30,
            head: head,
            body: body,
            foot: [[
                { content: 'Totais:', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCost), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIcms), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIcmsSt), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIpi), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalPis), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCofins), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIbs), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCbs), styles: { fontStyle: 'bold' } },
            ]],
            showFoot: 'lastPage',
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0, 0, 0], fontStyle: 'bold' },
        });

        doc.save(`analise_fiscal_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center">
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar XML da NF-e
                </Button>
                {items.length > 0 && (
                    <Button onClick={generatePdf} variant="secondary">
                        <Printer className="mr-2 h-4 w-4" />
                        Gerar PDF
                    </Button>
                )}
                {fileName && (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted flex-1 sm:flex-none justify-between">
                        <span className="text-sm text-muted-foreground truncate" title={fileName}>{fileName}</span>
                        <Button variant="ghost" size="icon" onClick={clearNfeData} className="h-6 w-6">
                            <FileX className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xml" />
            </div>

            {items.length > 0 && nfeInfo && (
                <div className="p-4 border rounded-lg bg-muted/50 backdrop-blur-sm shadow-inner">
                    <h3 className="text-lg font-bold mb-4 text-primary flex items-center gap-2">
                        <div className="w-2 h-6 bg-primary rounded-full"></div>
                        Informações da NF-e
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm mb-6">
                        <div className="space-y-1">
                            <div className="text-muted-foreground uppercase text-[10px] font-bold">Emitente</div>
                            <div className="font-medium text-base truncate">{nfeInfo.emitterName}</div>
                            <div className="text-muted-foreground">{nfeInfo.emitterCnpj}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground uppercase text-[10px] font-bold">Número da Nota</div>
                            <div className="font-medium text-base">№ {nfeInfo.nfeNumber}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground uppercase text-[10px] font-bold">Valor Total</div>
                            <div className="font-bold text-xl text-primary">{formatCurrency(nfeInfo.totalNf)}</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 p-4 bg-background/50 rounded-md border border-border/50">
                        <div className="space-y-1">
                            <div className="text-muted-foreground text-[10px] font-bold">ICMS</div>
                            <div className="font-bold">{formatCurrency(nfeInfo.totalIcms)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground text-[10px] font-bold">ICMS-ST</div>
                            <div className="font-bold">{formatCurrency(nfeInfo.totalIcmsSt)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground text-[10px] font-bold">IPI</div>
                            <div className="font-bold">{formatCurrency(nfeInfo.totalIpi)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground text-[10px] font-bold">PIS</div>
                            <div className="font-bold">{formatCurrency(nfeInfo.totalPis)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground text-[10px] font-bold">COFINS</div>
                            <div className="font-bold">{formatCurrency(nfeInfo.totalCofins)}</div>
                        </div>
                        <div className="space-y-1 border-l pl-4 border-primary/20 bg-primary/5 rounded-r">
                            <div className="text-primary text-[10px] font-bold">IBS (Novo)</div>
                            <div className="font-bold text-primary">{formatCurrency(nfeInfo.totalIbs || 0)}</div>
                        </div>
                        <div className="space-y-1 bg-primary/5 rounded-r">
                            <div className="text-primary text-[10px] font-bold">CBS (Novo)</div>
                            <div className="font-bold text-primary">{formatCurrency(nfeInfo.totalCbs || 0)}</div>
                        </div>
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <div className="w-full overflow-x-auto rounded-xl border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted hover:bg-muted">
                                <TableHead className="min-w-[200px] sticky left-0 z-20 bg-muted">Descrição</TableHead>
                                <TableHead className="text-center">NCM</TableHead>
                                <TableHead className="text-center">CST</TableHead>
                                <TableHead className="text-center">CFOP</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="text-right">Total Item</TableHead>
                                <TableHead className="text-right">ICMS</TableHead>
                                <TableHead className="text-right">ST</TableHead>
                                <TableHead className="text-right">IPI</TableHead>
                                <TableHead className="text-right">PIS</TableHead>
                                <TableHead className="text-right">COFINS</TableHead>
                                <TableHead className="text-right text-primary font-bold">IBS</TableHead>
                                <TableHead className="text-right text-primary font-bold">CBS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id} className="hover:bg-accent/30 transition-colors">
                                    <TableCell className="font-medium text-xs sticky left-0 z-10 bg-background/80 backdrop-blur-sm border-r">{item.description}</TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground font-mono">{item.ncm}</TableCell>
                                    <TableCell className="text-center text-xs font-mono">{item.cst}</TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground font-mono">{item.cfop}</TableCell>
                                    <TableCell className="text-right text-xs font-bold">{formatNumber(item.quantity)}</TableCell>
                                    <TableCell className="text-right text-xs">{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger className="cursor-help">{formatCurrency(item.icms)}</TooltipTrigger>
                                                <TooltipContent className="text-[10px]">Alíquota: {formatNumber(item.pIcms)}%</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{formatCurrency(item.icmsSt)}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger className="cursor-help">{formatCurrency(item.ipi)}</TooltipTrigger>
                                                <TooltipContent className="text-[10px]">Alíquota: {formatNumber(item.pIpi)}%</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger className="cursor-help">{formatCurrency(item.pis)}</TooltipTrigger>
                                                <TooltipContent className="text-[10px]">Alíquota: {formatNumber(item.pPis)}%</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger className="cursor-help">{formatCurrency(item.cofins)}</TooltipTrigger>
                                                <TooltipContent className="text-[10px]">Alíquota: {formatNumber(item.pCofins)}%</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-primary font-bold">
                                         <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger className="cursor-help">{formatCurrency(item.vIbs)}</TooltipTrigger>
                                                <TooltipContent className="text-[10px]">Alíquota IBS: {formatNumber(item.pIbs)}%</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-primary font-bold">
                                         <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger className="cursor-help">{formatCurrency(item.vCbs)}</TooltipTrigger>
                                                <TooltipContent className="text-[10px]">Alíquota CBS: {formatNumber(item.pCbs)}%</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/30">
                                <TableCell className="sticky left-0 bg-muted/80 z-10 text-right pr-4" colSpan={5}>TOTAIS DA NOTA:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIcms)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIcmsSt)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIpi)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalPis)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCofins)}</TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(totals.totalIbs)}</TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(totals.totalCbs)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}






