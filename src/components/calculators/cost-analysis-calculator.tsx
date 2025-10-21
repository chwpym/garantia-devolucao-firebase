
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useNfeParser } from "@/hooks/use-nfe-parser";
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
}

type NfeInfo = NfeParserInfo;

export default function CostAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
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
            
            const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI) || 0;
            const stValor = parseFloat(imposto?.ICMS?.ICMSST?.vICMSST) || 0;
            
            const freteRateado = parseFloat(prod.vFrete) || (totalFrete * itemWeight) || 0;
            const seguroRateado = parseFloat(prod.vSeg) || (totalSeguro * itemWeight) || 0;
            const descontoRateado = parseFloat(prod.vDesc) || (totalDesconto * itemWeight) || 0;
            const outrasRateado = parseFloat(prod.vOutro) || (totalOutras * itemWeight) || 0;
            
            const finalTotalCost = itemTotalCost + ipiValor + stValor + freteRateado + seguroRateado + outrasRateado - descontoRateado;
            const finalUnitCost = quantity > 0 ? finalTotalCost / quantity : 0;
            
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
                finalUnitCost: finalUnitCost,
                finalTotalCost: finalTotalCost,
                conversionFactor: "1",
                convertedUnitCost: finalUnitCost,
            };
        });
        
        setItems(newItems);

        toast({
            title: "Sucesso!",
            description: `${newItems.length} itens importados e analisados da NF-e.`,
        });
    };
    
    const { fileName, handleFileChange, clearNfeData, fileInputRef } = useNfeParser({ onNfeProcessed });


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
            formatNumber(item.quantity),
            formatNumber(parseFloat(item.conversionFactor) || 1),
            formatCurrency(item.unitCost),
            formatCurrency(item.ipi),
            formatCurrency(item.icmsST),
            formatCurrency(item.finalUnitCost),
            formatCurrency(item.convertedUnitCost),
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
            footStyles: { fillColor: [224, 224, 224], textColor: [0,0,0], fontStyle: 'bold' },
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
                                <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">Descrição</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="w-[100px]">Fator Conv.</TableHead>
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
                                    <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icmsST)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.frete)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.seguro)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.outras)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-third">{formatCurrency(item.convertedUnitCost)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 bg-muted/50 z-10 text-right" colSpan={4}>Totais:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIPI)}</TableCell>
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
