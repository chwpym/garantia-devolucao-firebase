"use client";

import { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";

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
    icmsSt: number;
    ipi: number;
    pis: number;
    cofins: number;
}

interface NfeInfo {
    emitterName: string;
    emitterCnpj: string;
    nfeNumber: string;
    totalIcms: number;
    totalIcmsSt: number;
    totalIpi: number;
    totalPis: number;
    totalCofins: number;
    totalNf: number;
}

interface NfeProductDetail {
    prod: Record<string, string>;
    imposto: {
        ICMS: Record<string, { CST: string, vICMS: string }>;
        IPI: { IPITrib: { vIPI: string } };
        PIS: { PISAliq: { vPIS: string }, PISST?: { vPIS: string } };
        COFINS: { COFINSAliq: { vCOFINS: string }, COFINSST?: { vCOFINS: string } };
    };
}

interface InfNFe {
    ['@_Id']: string;
    ide: { nNF: string };
    emit: { xNome: string; CNPJ: string };
    det: NfeProductDetail[] | NfeProductDetail;
    total: {
        ICMSTot: {
            vProd: string;
            vNF: string;
            vICMS: string;
            vST: string;
            vIPI: string;
            vPIS: string;
            vCOFINS: string;
        }
    }
}

interface NFeData {
    nfeProc?: { NFe: { infNFe: InfNFe } };
    NFe?: { infNFe: InfNFe };
}


export default function TaxAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const getIcmsValue = (icmsData: any): { vICMS: number, vICMSST: number, cst: string } => {
        let vICMS = 0;
        let vICMSST = 0;
        let cst = '';

        if (!icmsData) return { vICMS, vICMSST, cst };

        const icmsKeys = Object.keys(icmsData);
        if (icmsKeys.length > 0) {
            const icmsContent = icmsData[icmsKeys[0]];
            if (icmsContent) {
                 vICMS = parseFloat(icmsContent.vICMS) || 0;
                 vICMSST = parseFloat(icmsContent.vICMSST) || 0;
                 cst = icmsContent.CST || icmsContent.CSOSN || '';
            }
        }
        return { vICMS, vICMSST, cst };
    }

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

                const newNfeInfo: NfeInfo = {
                    emitterName: infNFe.emit?.xNome || 'N/A',
                    emitterCnpj: infNFe.emit?.CNPJ || 'N/A',
                    nfeNumber: infNFe.ide?.nNF || 'N/A',
                    totalIcms: parseFloat(total.vICMS) || 0,
                    totalIcmsSt: parseFloat(total.vST) || 0,
                    totalIpi: parseFloat(total.vIPI) || 0,
                    totalPis: parseFloat(total.vPIS) || 0,
                    totalCofins: parseFloat(total.vCOFINS) || 0,
                    totalNf: parseFloat(total.vNF) || 0,
                };
                setNfeInfo(newNfeInfo);
                
                const newItems: AnalyzedItem[] = dets.map((det, index: number) => {
                    const prod = det.prod;
                    const imposto = det.imposto;
                    
                    const { vICMS: icmsValor, vICMSST: stValor, cst } = getIcmsValue(imposto?.ICMS);

                    const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI) || 0;
                    const pisValor = parseFloat(imposto?.PIS?.PISAliq?.vPIS) || parseFloat(imposto?.PIS?.PISST?.vPIS) || 0;
                    const cofinsValor = parseFloat(imposto?.COFINS?.COFINSAliq?.vCOFINS) || parseFloat(imposto?.COFINS?.COFINSST?.vCOFINS) || 0;
                    
                    return {
                        id: Date.now() + index,
                        description: prod.xProd || "",
                        ncm: prod.NCM || "",
                        cst: cst,
                        cfop: prod.CFOP || "",
                        quantity: parseFloat(prod.qCom) || 0,
                        unitCost: parseFloat(prod.vUnCom) || 0,
                        totalCost: parseFloat(prod.vProd) || 0,
                        icms: icmsValor,
                        icmsSt: stValor,
                        ipi: ipiValor,
                        pis: pisValor,
                        cofins: cofinsValor,
                    };
                });
                
                setItems(newItems);

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
            acc.totalIcms += item.icms;
            acc.totalIcmsSt += item.icmsSt;
            acc.totalIpi += item.ipi;
            acc.totalPis += item.pis;
            acc.totalCofins += item.cofins;
            return acc;
        }, { 
            totalCost: 0, totalIcms: 0, totalIcmsSt: 0, totalIpi: 0, totalPis: 0, totalCofins: 0
        });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        
        doc.setFontSize(18);
        doc.text("Análise de Impostos por NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (nfeInfo) {
            doc.setFontSize(10);
            const startY = 32;
            doc.text(`NF-e: ${nfeInfo.nfeNumber}`, 14, startY);
            doc.text(`Emitente: ${nfeInfo.emitterName}`, 14, startY + 6);
            doc.text(`CNPJ: ${nfeInfo.emitterCnpj}`, 14, startY + 12);
            doc.text(`Valor Total NF-e: ${formatCurrency(nfeInfo.totalNf)}`, doc.internal.pageSize.getWidth() - 14, startY, { align: "right" });
        }

        const head = [['Descrição', 'Qtde', 'Custo Total', 'ICMS', 'ICMS-ST', 'IPI', 'PIS', 'COFINS']];
        const body = items.map(item => [
            item.description,
            formatNumber(item.quantity),
            formatCurrency(item.totalCost),
            formatCurrency(item.icms),
            formatCurrency(item.icmsSt),
            formatCurrency(item.ipi),
            formatCurrency(item.pis),
            formatCurrency(item.cofins),
        ]);
        
        const foot: RowInput[] = [
            [
                { content: 'Totais:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCost), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIcms), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIcmsSt), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalIpi), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalPis), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCofins), styles: { fontStyle: 'bold' } },
            ]
        ];

        autoTable(doc, {
            startY: nfeInfo ? 54 : 30,
            head: head,
            body: body,
            foot: foot,
            showFoot: 'lastPage',
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0, 0, 0], fontStyle: 'bold' },
            didDrawPage: (data: NonNullable<UserOptions['didDrawPage']>['arguments'][0]) => {
                doc.setFontSize(8);
                const pageText = `Página ${data.pageNumber}`;
                doc.text(pageText, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
    
        doc.save(`analise_impostos_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
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
            
            {items.length > 0 && nfeInfo && (
                <div className="p-4 border rounded-lg bg-muted/50">
                     <h3 className="text-lg font-medium mb-2">Informações da NF-e</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div><strong>Emitente:</strong> {nfeInfo.emitterName}</div>
                        <div><strong>CNPJ:</strong> {nfeInfo.emitterCnpj}</div>
                        <div><strong>NF-e Nº:</strong> {nfeInfo.nfeNumber}</div>
                        <div className="col-span-full font-semibold"><strong>Valor Total da NF-e:</strong> <span className="text-primary ml-2">{formatCurrency(nfeInfo.totalNf)}</span></div>
                    </div>
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-sm">
                        <div><strong>Total ICMS:</strong> {formatCurrency(nfeInfo.totalIcms)}</div>
                        <div><strong>Total ICMS-ST:</strong> {formatCurrency(nfeInfo.totalIcmsSt)}</div>
                        <div><strong>Total IPI:</strong> {formatCurrency(nfeInfo.totalIpi)}</div>
                        <div><strong>Total PIS:</strong> {formatCurrency(nfeInfo.totalPis)}</div>
                        <div><strong>Total COFINS:</strong> {formatCurrency(nfeInfo.totalCofins)}</div>
                    </div>
                </div>
            )}
            
            {items.length > 0 && (
                 <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">Descrição</TableHead>
                                <TableHead>NCM</TableHead>
                                <TableHead>CST</TableHead>
                                <TableHead>CFOP</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="text-right">Custo Total</TableHead>
                                <TableHead className="text-right">ICMS</TableHead>
                                <TableHead className="text-right">ICMS-ST</TableHead>
                                <TableHead className="text-right">IPI</TableHead>
                                <TableHead className="text-right">PIS</TableHead>
                                <TableHead className="text-right">COFINS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs sticky left-0 bg-background z-10">{item.description}</TableCell>
                                    <TableCell>{item.ncm}</TableCell>
                                    <TableCell>{item.cst}</TableCell>
                                    <TableCell>{item.cfop}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icms)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icmsSt)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.pis)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.cofins)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 bg-muted/50 z-10 text-right" colSpan={5}>Totais:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIcms)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIcmsSt)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIpi)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalPis)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCofins)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}
