
"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { useNfeParser } from "@/hooks/use-nfe-parser";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { NfeData, NfeInfo as NfeParserInfo } from "@/hooks/use-nfe-parser";

interface AnalyzedItem {
    id: number;
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
    finalUnitCost: number;
    finalTotalCost: number;
    conversionFactor: string;
    convertedUnitCost: number;
    vIBS: number;
    vCBS: number;
}

type NfeInfo = NfeParserInfo;

export default function CostAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const [manualFrete, setManualFrete] = useState("");
    const [manualSeguro, setManualSeguro] = useState("");
    const [manualOutros, setManualOutros] = useState("");
    const [manualDesconto, setManualDesconto] = useState("");
    const [useTaxReform, setUseTaxReform] = useState(false);
    const { toast } = useToast();

    const onNfeProcessed = (data: NfeData | null) => {
        if (!data) {
            setItems([]);
            setNfeInfo(null);
            return;
        }

        const { infNFe } = data;
        const total = infNFe.total.ICMSTot;
        const totalProdValue = parseFloat(total.vProd);

        const newNfeInfo: NfeInfo = {
            emitterName: infNFe.emit.xNome,
            emitterCnpj: infNFe.emit.CNPJ,
            nfeNumber: infNFe.ide.nNF,
        };
        setNfeInfo(newNfeInfo);

        const totalFrete = parseFloat(total.vFrete) || 0;
        const totalSeguro = parseFloat(total.vSeg) || 0;
        const totalDesconto = parseFloat(total.vDesc) || 0;
        const totalOutras = parseFloat(total.vOutro) || 0;

        const newItems: AnalyzedItem[] = data.det.map((det, index) => {
            const prod = det.prod;
            const imposto = det.imposto;

            const quantity = parseFloat(prod.qCom) || 0;
            const unitCost = parseFloat(prod.vUnCom) || 0;
            const itemTotalCost = parseFloat(prod.vProd) || 0;

            const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

            const extractST = (imposto: any): number => {
                if (!imposto?.ICMS) return 0;
                const icms = imposto.ICMS;
                for (const key in icms) {
                    if (icms[key]?.vICMSST) {
                        return parseFloat(icms[key].vICMSST) || 0;
                    }
                }
                return 0;
            };

            const vIBS = parseFloat(imposto?.IBSCBS?.gIBSCBS?.vIBS?.toString() || "0") || 0;
            const vCBS = parseFloat(imposto?.IBSCBS?.gIBSCBS?.gCBS?.vCBS?.toString() || "0") || 0;

            const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI?.toString() || "0") || 0;
            const stValor = extractST(imposto);

            const freteRateado = parseFloat(prod.vFrete) || (totalFrete * itemWeight) || 0;
            const seguroRateado = parseFloat(prod.vSeg) || (totalSeguro * itemWeight) || 0;
            const descontoRateado = parseFloat(prod.vDesc) || (totalDesconto * itemWeight) || 0;
            const outrasRateado = parseFloat(prod.vOutro) || (totalOutras * itemWeight) || 0;

            const taxReformValue = useTaxReform ? (vIBS + vCBS) : 0;
            const finalTotalCost = itemTotalCost + ipiValor + stValor + freteRateado + seguroRateado + outrasRateado + taxReformValue - descontoRateado;
            const finalUnitCost = quantity > 0 ? finalTotalCost / quantity : 0;

            return {
                id: index,
                description: prod.xProd || "",
                quantity: quantity,
                unitCost: unitCost,
                totalCost: itemTotalCost,
                ipi: ipiValor,
                icmsST: stValor,
                frete: freteRateado,
                seguro: seguroRateado,
                desconto: descontoRateado,
                outras: outrasRateado,
                finalUnitCost: finalUnitCost,
                finalTotalCost: finalTotalCost,
                conversionFactor: "1",
                convertedUnitCost: finalUnitCost,
                vIBS,
                vCBS
            };
        });

        setManualFrete("");
        setManualSeguro("");
        setManualOutros("");
        setManualDesconto("");

        setItems(newItems);

        toast({
            title: "Sucesso!",
            description: `${newItems.length} itens importados e analisados da NF-e.`,
        });
    };

    const { fileName, handleFileChange, clearNfeData, fileInputRef } = useNfeParser({ onNfeProcessed });

    const applyManualRateio = () => {
        setItems(prevItems => {
            const totalProdValue = prevItems.reduce((acc, item) => acc + item.totalCost, 0);
            const mFrete = parseFloat(manualFrete) || 0;
            const mSeg = parseFloat(manualSeguro) || 0;
            const mOutros = parseFloat(manualOutros) || 0;
            const mDesc = parseFloat(manualDesconto) || 0;

            if (totalProdValue === 0 && (mFrete + mSeg + mOutros + mDesc) > 0) return prevItems;

            return prevItems.map(item => {
                const itemWeight = totalProdValue > 0 ? item.totalCost / totalProdValue : 0;
                
                const newFrete = manualFrete ? (mFrete * itemWeight) : item.frete;
                const newSeguro = manualSeguro ? (mSeg * itemWeight) : item.seguro;
                const newOutras = manualOutros ? (mOutros * itemWeight) : item.outras;
                const newDesconto = manualDesconto ? (mDesc * itemWeight) : item.desconto;

                const taxReformValue = useTaxReform ? (item.vIBS + item.vCBS) : 0;
                const finalTotalCost = item.totalCost + item.ipi + item.icmsST + newFrete + newSeguro + newOutras + taxReformValue - newDesconto;
                const finalUnitCost = item.quantity > 0 ? finalTotalCost / item.quantity : 0;
                const factor = parseFloat(item.conversionFactor) || 1;

                return {
                    ...item,
                    frete: newFrete,
                    seguro: newSeguro,
                    outras: newOutras,
                    desconto: newDesconto,
                    finalTotalCost,
                    finalUnitCost,
                    convertedUnitCost: factor > 0 ? finalUnitCost / factor : 0
                };
            });
        });
        toast({ title: "Rateio Aplicado", description: "Custos atualizados com valores globais." });
    };

    const toggleTaxReform = (checked: boolean) => {
        setUseTaxReform(checked);
        setItems(prevItems => prevItems.map(item => {
            const taxReformValue = checked ? (item.vIBS + item.vCBS) : 0;
            const finalTotalCost = item.totalCost + item.ipi + item.icmsST + item.frete + item.seguro + item.outras + taxReformValue - item.desconto;
            const finalUnitCost = item.quantity > 0 ? finalTotalCost / item.quantity : 0;
            const factor = parseFloat(item.conversionFactor) || 1;

            return {
                ...item,
                finalTotalCost,
                finalUnitCost,
                convertedUnitCost: factor > 0 ? finalUnitCost / factor : 0
            };
        }));
    };



    const handleConversionFactorChange = (id: number, value: string) => {
        setItems(prevItems =>
            prevItems.map(item => {
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
            acc.finalTotalCost += item.finalTotalCost;
            return acc;
        }, { totalCost: 0, totalIPI: 0, totalST: 0, totalFrete: 0, totalSeguro: 0, totalDesconto: 0, totalOutras: 0, finalTotalCost: 0 });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(18);
        doc.text("Análise de Custo por NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (nfeInfo) {
            doc.setFontSize(10);
            doc.text(`NF-e: ${nfeInfo.nfeNumber}`, 14, 32);
            doc.text(`Emitente: ${nfeInfo.emitterName}`, 14, 38);
            doc.text(`CNPJ: ${nfeInfo.emitterCnpj}`, 14, 44);
        }

        const head = [['Descrição', 'Qtde', 'Fator Conv.', 'C. Un. Orig.', 'IPI', 'ICMS-ST', 'C. Un. Final', 'C. Un. Final (Conv.)', 'C. Total Final']];
        const body = items.map(item => [
            item.description,
            formatNumber4(item.quantity),
            formatNumber4(parseFloat(item.conversionFactor) || 1),
            formatCurrency4(item.unitCost),
            formatCurrency4(item.ipi),
            formatCurrency4(item.icmsST),
            formatCurrency4(item.finalUnitCost),
            formatCurrency4(item.convertedUnitCost),
            formatCurrency(item.finalTotalCost),
        ]);

        autoTable(doc, {
            startY: nfeInfo ? 50 : 30,
            head: head,
            body: body,
            foot: [
                [
                    { content: 'Totais:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalIPI), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalST), styles: { fontStyle: 'bold' } },
                    { content: '' },
                    { content: '' },
                    { content: formatCurrency(totals.finalTotalCost), styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
                ]
            ],
            showFoot: 'lastPage',
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0, 0, 0], fontStyle: 'bold' },
            didDrawPage: (data: NonNullable<UserOptions['didDrawPage']>['arguments'][0]) => {
                const pageCount = doc.internal.pages.length;
                doc.setFontSize(8);
                const pageText = `Página ${data.pageNumber} de ${pageCount}`;
                doc.text(pageText, data.settings.margin.left, doc.internal.pageSize.height - 10);
                if (fileName) {
                    doc.text(`Arquivo: ${fileName}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
                }
            }
        });

        doc.save(`analise_custo_nfe_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
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
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xml"
                />

                {items.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 bg-accent/5 p-2 rounded-md border border-accent/20">
                        <div className="flex items-center gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Rateio Manual:</Label>
                            <div className="flex gap-x-1">
                                <Input placeholder="Frete" value={manualFrete} onChange={e => setManualFrete(e.target.value)} className="w-20 h-7 text-[10px] bg-background" />
                                <Input placeholder="Seguro" value={manualSeguro} onChange={e => setManualSeguro(e.target.value)} className="w-16 h-7 text-[10px] bg-background" />
                                <Input placeholder="Outros" value={manualOutros} onChange={e => setManualOutros(e.target.value)} className="w-16 h-7 text-[10px] bg-background" />
                                <Input placeholder="Desconto" value={manualDesconto} onChange={e => setManualDesconto(e.target.value)} className="w-16 h-7 text-[10px] bg-background border-destructive/30" />
                            </div>
                            <Button onClick={applyManualRateio} size="sm" variant="outline" className="h-7 px-2 text-[10px] bg-accent-blue/10 border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white transition-all">
                                Ratear
                            </Button>
                        </div>

                        <div className="h-6 w-[1px] bg-border mx-1"></div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="tax-reform" className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer">Reforma (IBS/CBS)</Label>
                            <Switch id="tax-reform" checked={useTaxReform} onCheckedChange={toggleTaxReform} className="scale-75" />
                            {useTaxReform && <Badge variant="outline" className="h-5 text-[8px] border-primary text-primary bg-primary/5">Ativo</Badge>}
                        </div>
                    </div>
                )}
            </div>

            {nfeInfo && items.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted space-y-2">
                    <h3 className="text-lg font-medium">Informações da NF-e</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div><strong>Emitente:</strong> {nfeInfo.emitterName}</div>
                        <div><strong>CNPJ:</strong> {nfeInfo.emitterCnpj}</div>
                        <div><strong>NF-e Nº:</strong> {nfeInfo.nfeNumber}</div>
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] sticky left-0 z-10">Descrição</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="w-[150px]">Fator Conv.</TableHead>
                                <TableHead className="text-right">Custo Un. Orig.</TableHead>
                                <TableHead className="text-right">Custo Total Orig.</TableHead>
                                <TableHead className="text-right">IPI</TableHead>
                                <TableHead className="text-right">ICMS-ST</TableHead>
                                <TableHead className="text-right">Frete</TableHead>
                                <TableHead className="text-right">Seguro</TableHead>
                                <TableHead className="text-right">Desconto</TableHead>
                                <TableHead className="text-right">Outras</TableHead>
                                <TableHead className="text-right text-primary font-bold">Custo Un. Final</TableHead>
                                <TableHead className="text-right text-third font-bold">C. Un. Final (Conv.)</TableHead>
                                <TableHead className="text-right text-primary font-bold">Custo Total Final</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs sticky left-0 z-10">{item.description}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 text-right bg-transparent border-0 border-b border-transparent focus-visible:border-primary focus-visible:ring-0 shadow-none text-xs rounded-none p-1"
                                            value={item.conversionFactor}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(',', '.');
                                                if (val === '' || !isNaN(Number(val))) {
                                                    handleConversionFactorChange(item.id, val);
                                                }
                                            }}
                                            placeholder="1"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency4(item.unitCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icmsST)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.frete)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.seguro)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.outras)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency4(item.finalUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-third">{formatCurrency4(item.convertedUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted">
                                <TableCell className="sticky left-0 bg-muted z-10 text-right" colSpan={4}>Totais:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell className="text-right">
                                    <TooltipProvider>
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger className="cursor-help underline decoration-dotted">
                                                {formatCurrency(totals.totalIPI)}
                                            </TooltipTrigger>
                                            <TooltipContent className="p-2 text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between gap-4"><span>IPI:</span> <span>{formatCurrency(totals.totalIPI)}</span></div>
                                                    <div className="flex justify-between gap-4"><span>ICMS-ST:</span> <span>{formatCurrency(totals.totalST)}</span></div>
                                                    {useTaxReform && (
                                                        <>
                                                            <div className="flex justify-between gap-4 text-primary font-bold border-t pt-1"><span>IBS:</span> <span>{formatCurrency(items.reduce((acc, i) => acc + i.vIBS, 0))}</span></div>
                                                            <div className="flex justify-between gap-4 text-primary font-bold"><span>CBS:</span> <span>{formatCurrency(items.reduce((acc, i) => acc + i.vCBS, 0))}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalST)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalFrete)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalSeguro)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalOutras)}</TableCell>
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(totals.finalTotalCost)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}
