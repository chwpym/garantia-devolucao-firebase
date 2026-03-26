
"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput, Styles } from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNfeParser, type NfeData, type NfeInfo as NfeParserInfo, type NfeProductDetail } from "@/hooks/use-nfe-parser";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type TaxRegime = 'lucro_real' | 'simples_nacional';

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
    pis: number;
    cofins: number;
    finalUnitCost: number;
    finalTotalCost: number;
    conversionFactor: string;
    convertedUnitCost: number;
    vIBS: number;
    vCBS: number;
}

interface NfeInfo extends NfeParserInfo {
    totalGrossValue: number;
}


export default function AdvancedCostAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const [manualFrete, setManualFrete] = useState("");
    const [manualSeguro, setManualSeguro] = useState("");
    const [manualOutros, setManualOutros] = useState("");
    const [manualDesconto, setManualDesconto] = useState("");
    const [useTaxReform, setUseTaxReform] = useState(false);
    const { toast } = useToast();
    const [taxRegime, setTaxRegime] = useState<TaxRegime>('lucro_real');

    const recalculateCosts = (currentItems: Omit<AnalyzedItem, 'finalUnitCost' | 'finalTotalCost' | 'convertedUnitCost'>[], regime: TaxRegime, taxReform: boolean): AnalyzedItem[] => {
        return currentItems.map(item => {
            const baseTotalCost = item.totalCost + item.ipi + item.icmsST + item.frete + item.seguro + item.outras - item.desconto;
            
            // In Tax Reform, IBS/CBS are added to base cost if reform is ON
            const taxReformValue = taxReform ? (item.vIBS + item.vCBS) : 0;
            let finalTotalCost = baseTotalCost + taxReformValue;

            if (regime === 'lucro_real') {
                finalTotalCost -= (item.pis + item.cofins);
                // If tax reform is ON and regime is Lucro Real, we also get credit for IBS/CBS
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

    const onNfeProcessed = (data: NfeData | null) => {
        if (!data) {
            setItems([]);
            setNfeInfo(null);
            return;
        }

        const { infNFe, det: dets } = data;
        const total = infNFe.total.ICMSTot;

        const totalProdValue = parseFloat(total.vProd) || 0;
        const totalFrete = parseFloat(total.vFrete) || 0;
        const totalSeguro = parseFloat(total.vSeg) || 0;
        const totalDesconto = parseFloat(total.vDesc) || 0;
        const totalOutras = parseFloat(total.vOutro) || 0;
        const totalST = parseFloat(total.vST) || 0;
        const totalIPI = parseFloat(total.vIPI) || 0;

        const newNfeInfo: NfeInfo = {
            emitterName: infNFe.emit.xNome,
            emitterCnpj: infNFe.emit.CNPJ,
            nfeNumber: infNFe.ide.nNF,
            totalGrossValue: totalProdValue + totalFrete + totalSeguro + totalOutras + totalST + totalIPI,
        };
        setNfeInfo(newNfeInfo);

        const extractST = (imposto: any): number => {
            if (!imposto?.ICMS) return 0;
            const icms = imposto.ICMS;
            // Iterate through all possible ICMS tags (ICMS00, ICMS10, ICMSST, etc.)
            for (const key in icms) {
                if (icms[key]?.vICMSST) {
                    return parseFloat(icms[key].vICMSST) || 0;
                }
            }
            return 0;
        };

        const newItems: Omit<AnalyzedItem, 'finalUnitCost' | 'finalTotalCost' | 'convertedUnitCost'>[] = dets.map((det: NfeProductDetail, index: number) => {
            const prod = det.prod;
            const imposto = det.imposto;

            const quantity = parseFloat(prod.qCom) || 0;
            const unitCost = parseFloat(prod.vUnCom) || 0;
            const itemTotalCost = parseFloat(prod.vProd) || 0;

            const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

            const vIBS = parseFloat(imposto?.IBSCBS?.gIBSCBS?.vIBS?.toString() || "0") || 0;
            const vCBS = parseFloat(imposto?.IBSCBS?.gIBSCBS?.gCBS?.vCBS?.toString() || "0") || 0;

            const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI?.toString() || "0") || 0;
            const stValor = extractST(imposto);
            const pisValor = parseFloat(imposto?.PIS?.PISAliq?.vPIS?.toString() || "0") || parseFloat(imposto?.PIS?.PISST?.vPIS?.toString() || "0") || 0;
            const cofinsValor = parseFloat(imposto?.COFINS?.COFINSAliq?.vCOFINS?.toString() || "0") || parseFloat(imposto?.COFINS?.COFINSST?.vCOFINS?.toString() || "0") || 0;

            const freteRateado = parseFloat(prod.vFrete) || (totalFrete * itemWeight) || 0;
            const seguroRateado = parseFloat(prod.vSeg) || (totalSeguro * itemWeight) || 0;
            const descontoRateado = parseFloat(prod.vDesc) || (totalDesconto * itemWeight) || 0;
            const outrasRateado = parseFloat(prod.vOutro) || (totalOutras * itemWeight) || 0;

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
                pis: pisValor,
                cofins: cofinsValor,
                conversionFactor: "1",
                vIBS,
                vCBS
            };
        });

        setItems(recalculateCosts(newItems, 'lucro_real', useTaxReform));
        setTaxRegime('lucro_real');
        setManualFrete("");
        setManualSeguro("");
        setManualOutros("");
        setManualDesconto("");

        toast({
            title: "Sucesso!",
            description: `${newItems.length} itens importados e analisados da NF-e.`,
        });
    }

    const { fileName, handleFileChange, clearNfeData, fileInputRef } = useNfeParser({ onNfeProcessed });



    const handleTaxRegimeChange = (value: string) => {
        const newRegime = value as TaxRegime;
        setTaxRegime(newRegime);
        setItems(prevItems => recalculateCosts(prevItems, newRegime, useTaxReform));
    };

    const toggleTaxReform = (checked: boolean) => {
        setUseTaxReform(checked);
        setItems(prevItems => recalculateCosts(prevItems, taxRegime, checked));
    };

    const applyManualRateio = () => {
        setItems(prevItems => {
            const totalProdValue = prevItems.reduce((acc, item) => acc + item.totalCost, 0);
            const mFrete = parseFloat(manualFrete) || 0;
            const mSeg = parseFloat(manualSeguro) || 0;
            const mOutros = parseFloat(manualOutros) || 0;
            const mDesc = parseFloat(manualDesconto) || 0;

            if (totalProdValue === 0 && (mFrete + mSeg + mOutros + mDesc) > 0) return prevItems;

            const updatedRaw = prevItems.map(item => {
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
        toast({ title: "Rateio Aplicado", description: "Custos atualizados com valores globais." });
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
            acc.totalPIS += item.pis;
            acc.totalCOFINS += item.cofins;
            acc.finalTotalCost += item.finalTotalCost;
            return acc;
        }, {
            totalCost: 0, totalIPI: 0, totalST: 0, totalFrete: 0, totalSeguro: 0,
            totalDesconto: 0, totalOutras: 0, totalPIS: 0, totalCOFINS: 0, finalTotalCost: 0
        });
    }, [items]);

    const totalWithoutPisCofins = useMemo(() => {
        if (taxRegime === 'simples_nacional') return totals.finalTotalCost;
        return totals.finalTotalCost + totals.totalPIS + totals.totalCOFINS;
    }, [totals, taxRegime]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(18);
        doc.text("Análise de Custo Avançada por NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (nfeInfo) {
            doc.setFontSize(10);
            const startY = 32;
            doc.text(`NF-e: ${nfeInfo.nfeNumber}`, 14, startY);
            doc.text(`Emitente: ${nfeInfo.emitterName}`, 14, startY + 6);
            doc.text(`CNPJ: ${nfeInfo.emitterCnpj}`, 14, startY + 12);
            doc.text(`Regime: ${taxRegime === 'lucro_real' ? 'Lucro Real' : 'Simples Nacional'}`, doc.internal.pageSize.getWidth() - 14, startY, { align: "right" });
            doc.text(`Custo Total Final: ${formatCurrency(totals.finalTotalCost)}`, doc.internal.pageSize.getWidth() - 14, startY + 6, { align: "right" });
        }

        const head = [['Descrição', 'Qtde', 'Fator Conv.', 'C. Un. Orig.', 'IPI', 'ICMS-ST', 'Frete', 'Seguro', 'Desconto', 'Outras', 'PIS', 'COFINS', 'C. Un. Final', 'C. Un. Final (Conv.)', 'C. Total Final']];
        const body = items.map(item => [
            item.description,
            formatNumber4(item.quantity),
            formatNumber4(parseFloat(item.conversionFactor) || 1),
            formatCurrency4(item.unitCost),
            formatCurrency4(item.ipi),
            formatCurrency4(item.icmsST),
            formatCurrency4(item.frete),
            formatCurrency4(item.seguro),
            formatCurrency4(item.desconto),
            formatCurrency4(item.outras),
            formatCurrency4(item.pis),
            formatCurrency4(item.cofins),
            formatCurrency4(item.finalUnitCost),
            formatCurrency4(item.convertedUnitCost),
            formatCurrency(item.finalTotalCost),
        ]);

        const footStyles: Partial<Styles> = { fontStyle: 'bold', fillColor: [224, 224, 224], textColor: [0, 0, 0] };

        const foot: RowInput[] = [
            [
                { content: 'Totais:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIPI), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalST), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalFrete), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalSeguro), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalDesconto), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalOutras), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalPIS), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCOFINS), styles: { fontStyle: 'bold' } },
                { content: '' },
                { content: '' },
                { content: formatCurrency(totals.finalTotalCost), styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
            ]
        ];

        autoTable(doc, {
            startY: nfeInfo ? 54 : 30,
            head: head,
            body: body,
            foot: foot,
            showFoot: 'lastPage',
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: footStyles,
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

        doc.save(`analise_custo_avancada_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
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

            {items.length > 0 && nfeInfo && (
                <div className="flex flex-col md:flex-row gap-4 md:items-center p-4 border rounded-lg bg-muted">
                    <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-medium">Informações da NF-e</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div><strong>Emitente:</strong> {nfeInfo.emitterName}</div>
                            <div><strong>CNPJ:</strong> {nfeInfo.emitterCnpj}</div>
                            <div><strong>NF-e Nº:</strong> {nfeInfo.nfeNumber}</div>
                            <div><strong>Total Bruto (s/ desc):</strong> {formatCurrency4(nfeInfo.totalGrossValue)}</div>
                            <div className="font-semibold text-sm"><strong>Custo Total (sem crédito PIS/COFINS):</strong> <span className="font-bold ml-2">{formatCurrency4(totalWithoutPisCofins)}</span></div>
                            <div className="font-semibold col-span-full">
                                <strong>Custo Total Final ({taxRegime === 'lucro_real' ? 'c/ crédito PIS/COFINS' : 's/ crédito PIS/COFINS'}):</strong>
                                <span className="font-bold text-primary ml-2">{formatCurrency4(totals.finalTotalCost)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax-regime">Regime Tributário (Cálculo)</Label>
                        <Select onValueChange={handleTaxRegimeChange} value={taxRegime}>
                            <SelectTrigger id="tax-regime" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Selecione o regime" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lucro_real">Lucro Real (com crédito PIS/COFINS)</SelectItem>
                                <SelectItem value="simples_nacional">Simples Nacional (sem crédito PIS/COFINS)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Define se o PIS/COFINS será abatido do custo.</p>
                    </div>
                </div>
            )}
            {(taxRegime === 'lucro_real' || useTaxReform) && items.length > 0 && (
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-bold">Cálculo de Custo com Créditos Tributários</AlertTitle>
                    <AlertDescription className="text-xs">
                        {taxRegime === 'lucro_real' && "Os valores de PIS e COFINS estão sendo subtraídos do custo (crédito)."}
                        {useTaxReform && taxRegime === 'lucro_real' && <br />}
                        {useTaxReform && taxRegime === 'lucro_real' && "Com a Reforma ativa, IBS e CBS também geram crédito e são subtraídos no Lucro Real."}
                        {useTaxReform && taxRegime !== 'lucro_real' && "Com a Reforma ativa, IBS e CBS são somados ao custo final do produto."}
                    </AlertDescription>
                </Alert>
            )}


            {items.length > 0 && (
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] sticky left-0 z-10">Descrição</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="w-[150px]">Fator Conv.</TableHead>
                                <TableHead className="text-right">C. Un. Orig.</TableHead>
                                <TableHead className="text-right">IPI</TableHead>
                                <TableHead className="text-right">ICMS-ST</TableHead>
                                <TableHead className="text-right">Frete</TableHead>
                                <TableHead className="text-right">Seguro</TableHead>
                                <TableHead className="text-right">Desconto</TableHead>
                                <TableHead className="text-right">Outras</TableHead>
                                <TableHead className="text-right text-accent-green">PIS</TableHead>
                                <TableHead className="text-right text-accent-green">COFINS</TableHead>
                                <TableHead className="text-right text-primary font-bold">C. Un. Final</TableHead>
                                <TableHead className="text-right text-third font-bold">C. Un. Final (Conv.)</TableHead>
                                <TableHead className="text-right text-primary font-bold">C. Total Final</TableHead>
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
                                    <TableCell className="text-right">{formatCurrency4(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency4(item.icmsST)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency4(item.frete)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency4(item.seguro)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency4(item.desconto)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency4(item.outras)}</TableCell>
                                    <TableCell className="text-right text-accent-green">{formatCurrency4(item.pis)}</TableCell>
                                    <TableCell className="text-right text-accent-green">{formatCurrency4(item.cofins)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency4(item.finalUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-third">{formatCurrency4(item.convertedUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted">
                                <TableCell className="sticky left-0 bg-muted z-10 text-right" colSpan={4}>Totais:</TableCell>
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
                                <TableCell className="text-right text-accent-green">{formatCurrency(totals.totalPIS)}</TableCell>
                                <TableCell className="text-right text-accent-green">{formatCurrency(totals.totalCOFINS)}</TableCell>
                                <TableCell colSpan={2} className="text-right">Custo Total Final:</TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(totals.finalTotalCost)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}

