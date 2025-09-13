
"use client";

import { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput, Styles, HookData } from "jspdf-autotable";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
}

interface NfeInfo {
    emitterName: string;
    emitterCnpj: string;
    nfeNumber: string;
    totalGrossValue: number;
}

interface NfeProductDetail {
    prod: Record<string, string>;
    imposto: Record<string, Record<string, Record<string, string>>>;
}

interface InfNFe {
    ['@_Id']: string;
    ide: { nNF: string };
    emit: { xNome: string; CNPJ: string };
    det: NfeProductDetail[] | NfeProductDetail;
    total: {
        ICMSTot: {
            vProd: string;
            vFrete: string;
            vSeg: string;
            vDesc: string;
            vOutro: string;
            vST: string;
            vIPI: string;
        }
    }
}

interface NFeData {
    nfeProc?: { NFe: { infNFe: InfNFe } };
    NFe?: { infNFe: InfNFe };
}


export default function AdvancedCostAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [taxRegime, setTaxRegime] = useState<TaxRegime>('lucro_real');

    const handleImportXml = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlData = e.target?.result as string;
                const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
                const jsonObj = parser.parse(xmlData) as NFeData;
                
                const infNFe: InfNFe | undefined = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
                if (!infNFe) {
                    throw new Error("Estrutura do XML da NF-e inválida: <infNFe> não encontrado.");
                }

                const dets: NfeProductDetail[] = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
                const total = infNFe.total?.ICMSTot;

                if (!dets || !total) {
                    throw new Error("Estrutura do XML da NF-e inválida: <det> ou <ICMSTot> não encontrados.");
                }

                const totalProdValue = parseFloat(total.vProd) || 0;
                
                const totalFrete = parseFloat(total.vFrete) || 0;
                const totalSeguro = parseFloat(total.vSeg) || 0;
                const totalDesconto = parseFloat(total.vDesc) || 0;
                const totalOutras = parseFloat(total.vOutro) || 0;
                const totalST = parseFloat(total.vST) || 0;
                const totalIPI = parseFloat(total.vIPI) || 0;

                const newNfeInfo: NfeInfo = {
                    emitterName: infNFe.emit?.xNome || 'N/A',
                    emitterCnpj: infNFe.emit?.CNPJ || 'N/A',
                    nfeNumber: infNFe.ide?.nNF || 'N/A',
                    totalGrossValue: totalProdValue + totalFrete + totalSeguro + totalOutras + totalST + totalIPI,
                };
                setNfeInfo(newNfeInfo);
                
                const newItems: Omit<AnalyzedItem, 'finalUnitCost' | 'finalTotalCost' | 'convertedUnitCost'>[] = dets.map((det: NfeProductDetail, index: number) => {
                    const prod = det.prod;
                    const imposto = det.imposto;

                    const quantity = parseFloat(prod.qCom) || 0;
                    const unitCost = parseFloat(prod.vUnCom) || 0;
                    const itemTotalCost = parseFloat(prod.vProd) || 0;
                    
                    const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

                    const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI) || 0;
                    const stValor = parseFloat(imposto?.ICMS?.ICMSST?.vICMSST) || 0;
                    const pisValor = parseFloat(imposto?.PIS?.PISAliq?.vPIS) || parseFloat(imposto?.PIS?.PISST?.vPIS) || 0;
                    const cofinsValor = parseFloat(imposto?.COFINS?.COFINSAliq?.vCOFINS) || parseFloat(imposto?.COFINS?.COFINSST?.vCOFINS) || 0;

                    const freteRateado = parseFloat(prod.vFrete) || (totalFrete * itemWeight) || 0;
                    const seguroRateado = parseFloat(prod.vSeg) || (totalSeguro * itemWeight) || 0;
                    const descontoRateado = parseFloat(prod.vDesc) || (totalDesconto * itemWeight) || 0;
                    const outrasRateado = parseFloat(prod.vOutro) || (totalOutras * itemWeight) || 0;
                    
                    return {
                        id: Date.now() + index,
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
                    };
                });
                
                setItems(recalculateCosts(newItems, taxRegime));

                toast({
                    title: "Sucesso!",
                    description: `${newItems.length} itens importados e analisados da NF-e.`,
                });

            } catch (error: unknown) {
                console.error("Erro ao processar o XML:", error);
                setItems([]);
                setFileName(null);
                setNfeInfo(null);
                const message = error instanceof Error ? error.message : "Não foi possível ler o arquivo XML. Verifique se o formato é uma NF-e válida.";
                toast({
                    variant: "destructive",
                    title: "Erro de Importação",
                    description: message,
                });
            } finally {
              if(fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
        };
        reader.readAsText(file, 'ISO-8859-1');
    };

    const recalculateCosts = (currentItems: Omit<AnalyzedItem, 'finalUnitCost' | 'finalTotalCost' | 'convertedUnitCost'>[], regime: TaxRegime): AnalyzedItem[] => {
        return currentItems.map(item => {
            const baseTotalCost = item.totalCost + item.ipi + item.icmsST + item.frete + item.seguro + item.outras - item.desconto;
            
            let finalTotalCost = baseTotalCost;
            if (regime === 'lucro_real') {
                finalTotalCost -= (item.pis + item.cofins);
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
        setItems(prevItems => recalculateCosts(prevItems, newRegime));
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

    const clearData = () => {
        setItems([]);
        setFileName(null);
        setNfeInfo(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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
        if(taxRegime === 'simples_nacional') return totals.finalTotalCost;
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
            formatNumber(item.quantity),
            formatNumber(parseFloat(item.conversionFactor) || 1),
            formatCurrency(item.unitCost),
            formatCurrency(item.ipi),
            formatCurrency(item.icmsST),
            formatCurrency(item.frete),
            formatCurrency(item.seguro),
            formatCurrency(item.desconto),
            formatCurrency(item.outras),
            formatCurrency(item.pis),
            formatCurrency(item.cofins),
            formatCurrency(item.finalUnitCost),
            formatCurrency(item.convertedUnitCost),
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
            didDrawPage: (data: HookData) => {
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
                        <Button variant="ghost" size="icon" onClick={clearData} className="h-6 w-6">
                        <FileX className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportXml}
                    className="hidden" 
                    accept=".xml"
                />
            </div>
            
            {items.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 md:items-center p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 flex-1">
                         <h3 className="text-lg font-medium">Informações da NF-e</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div><strong>Emitente:</strong> {nfeInfo?.emitterName}</div>
                            <div><strong>CNPJ:</strong> {nfeInfo?.emitterCnpj}</div>
                            <div><strong>NF-e Nº:</strong> {nfeInfo?.nfeNumber}</div>
                            <div><strong>Total Bruto (s/ desc):</strong> {formatCurrency(nfeInfo?.totalGrossValue ?? 0)}</div>
                            <div className="font-semibold text-sm"><strong>Custo Total (sem crédito PIS/COFINS):</strong> <span className="font-bold ml-2">{formatCurrency(totalWithoutPisCofins)}</span></div>
                            <div className="font-semibold col-span-full">
                                <strong>Custo Total Final ({taxRegime === 'lucro_real' ? 'c/ crédito PIS/COFINS' : 's/ crédito PIS/COFINS'}):</strong> 
                                <span className="font-bold text-primary ml-2">{formatCurrency(totals.finalTotalCost)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax-regime">Regime Tributário (Cálculo)</Label>
                        <Select onValueChange={handleTaxRegimeChange} defaultValue={taxRegime}>
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
             {taxRegime === 'lucro_real' && items.length > 0 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Cálculo de Custo para Lucro Real</AlertTitle>
                    <AlertDescription>
                        Os valores de PIS e COFINS estão sendo subtraídos do custo, considerando o crédito destes impostos.
                    </AlertDescription>
                </Alert>
            )}


            {items.length > 0 && (
                 <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">Descrição</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="w-[100px]">Fator Conv.</TableHead>
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
                                    <TableCell className="font-medium text-xs sticky left-0 bg-background z-10">{item.description}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 text-right"
                                            value={item.conversionFactor}
                                            onChange={(e) => handleConversionFactorChange(item.id, e.target.value)}
                                            placeholder="1"
                                            min="0"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icmsST)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.frete)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.seguro)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.outras)}</TableCell>
                                    <TableCell className="text-right text-accent-green">{formatCurrency(item.pis)}</TableCell>
                                    <TableCell className="text-right text-accent-green">{formatCurrency(item.cofins)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(item.finalUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-third">{formatCurrency(item.convertedUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 bg-muted/50 z-10 text-right" colSpan={4}>Totais:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIPI)}</TableCell>
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

    

    

    