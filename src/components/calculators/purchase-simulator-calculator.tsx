
"use client";

import { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface SimulatedItem {
    id: number;
    description: string;
    originalQuantity: number;
    simulatedQuantity: string;
    unitCost: number; // This is the net cost from XML
    additionalCosts: number; // This is the calculated additional cost per unit
    ipi: number;
    icmsST: number;
    frete: number;
    seguro: number;
    desconto: number;
    outras: number;
    finalUnitCost: number;
    originalTotalCost: number;
    simulatedTotalCost: number;
}

interface NfeInfo {
    emitterName: string;
    emitterCnpj: string;
    nfeNumber: string;
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
        }
    }
}

interface NFeData {
    nfeProc?: { NFe: { infNFe: InfNFe } };
    NFe?: { infNFe: InfNFe };
}


export default function PurchaseSimulatorCalculator() {
    const [items, setItems] = useState<SimulatedItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const calculateCosts = (item: Omit<SimulatedItem, 'id' | 'description' | 'finalUnitCost' | 'originalTotalCost' | 'simulatedTotalCost'>) => {
        const totalAdditionalCosts = item.ipi + item.icmsST + item.frete + item.seguro + item.outras - item.desconto;
        const additionalCostsPerUnit = item.originalQuantity > 0 ? totalAdditionalCosts / item.originalQuantity : 0;
        
        const finalUnitCost = item.unitCost + additionalCostsPerUnit;
        const originalTotalCost = finalUnitCost * item.originalQuantity;
        const simulatedTotalCost = finalUnitCost * (parseFloat(item.simulatedQuantity) || 0);

        return { additionalCosts: additionalCostsPerUnit, finalUnitCost, originalTotalCost, simulatedTotalCost };
    };

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
                if (!infNFe) throw new Error("Estrutura do XML da NF-e inválida.");
                
                const dets = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
                const total = infNFe.total.ICMSTot;
                const totalProdValue = parseFloat(total.vProd);

                setNfeInfo({
                    emitterName: infNFe.emit.xNome,
                    emitterCnpj: infNFe.emit.CNPJ,
                    nfeNumber: infNFe.ide.nNF,
                });

                const newItems: SimulatedItem[] = dets.map((det, index) => {
                    const prod = det.prod;
                    const imposto = det.imposto;
                    const itemTotalCost = parseFloat(prod.vProd);
                    const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;
                    
                    const baseItem = {
                        originalQuantity: parseFloat(prod.qCom),
                        simulatedQuantity: prod.qCom,
                        unitCost: parseFloat(prod.vUnCom),
                        ipi: parseFloat(imposto.IPI?.IPITrib?.vIPI) || 0,
                        icmsST: parseFloat(imposto.ICMS?.ICMSST?.vICMSST) || 0,
                        frete: (parseFloat(total.vFrete) || 0) * itemWeight,
                        seguro: (parseFloat(total.vSeg) || 0) * itemWeight,
                        desconto: (parseFloat(total.vDesc) || 0) * itemWeight,
                        outras: (parseFloat(total.vOutro) || 0) * itemWeight,
                    };
                    
                    const costs = calculateCosts(baseItem);

                    return {
                        id: Date.now() + index,
                        description: prod.xProd,
                        ...baseItem,
                        ...costs,
                    };
                });
                
                setItems(newItems);
                toast({ title: "Sucesso!", description: `${newItems.length} itens importados da NF-e.` });
            } catch (error) {
                console.error("Erro ao processar o XML:", error);
                setItems([]);
                setFileName(null);
                setNfeInfo(null);
                toast({ variant: "destructive", title: "Erro de Importação", description: "Não foi possível ler o arquivo XML." });
            } finally {
              if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file, 'ISO-8859-1');
    };
    
    const handleQuantityChange = (id: number, value: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const simulatedQuantity = value;
                const simulatedTotalCost = item.finalUnitCost * (parseFloat(simulatedQuantity) || 0);
                return { ...item, simulatedQuantity, simulatedTotalCost };
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        toast({title: "Item removido da simulação."})
    };

    const clearData = () => {
        setItems([]);
        setFileName(null);
        setNfeInfo(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };
    
    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.originalTotalCost += item.originalTotalCost;
            acc.simulatedTotalCost += item.simulatedTotalCost;
            return acc;
        }, { originalTotalCost: 0, simulatedTotalCost: 0 });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Simulação de Compra por NF-e", 14, 22);

        if (nfeInfo) {
            doc.setFontSize(10);
            doc.text(`NF-e: ${nfeInfo.nfeNumber} | Emitente: ${nfeInfo.emitterName}`, 14, 32);
        }

        const head = [['Descrição', 'Qtde Orig.', 'Qtde Sim.', 'Custo Un. Final', 'Custo Total Orig.', 'Custo Total Sim.']];
        const body = items.map(item => [
            item.description,
            formatNumber(item.originalQuantity),
            formatNumber(parseFloat(item.simulatedQuantity) || 0),
            formatCurrency(item.finalUnitCost),
            formatCurrency(item.originalTotalCost),
            formatCurrency(item.simulatedTotalCost),
        ]);
        
        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            foot: [
                ['Total:', '', '', '', formatCurrency(totals.originalTotalCost), formatCurrency(totals.simulatedTotalCost)]
            ],
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fontStyle: 'bold', fillColor: [224, 224, 224], textColor: [0, 0, 0] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(`Economia Potencial: ${formatCurrency(totals.originalTotalCost - totals.simulatedTotalCost)}`, 14, finalY);
    
        doc.save(`simulacao_compra_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
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
                <Input type="file" ref={fileInputRef} onChange={handleImportXml} className="hidden" accept=".xml" />
            </div>

            {items.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custo Total Original</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totals.originalTotalCost)}</div>
                            <p className="text-xs text-muted-foreground">Valor total calculado da NF-e importada.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custo Total Simulado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(totals.simulatedTotalCost)}</div>
                             <p className="text-xs text-muted-foreground">Valor com base nas quantidades alteradas.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Economia Potencial</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-accent-green">{formatCurrency(totals.originalTotalCost - totals.simulatedTotalCost)}</div>
                             <p className="text-xs text-muted-foreground">Diferença entre o original e o simulado.</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {items.length > 0 && (
                 <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] p-2">Descrição</TableHead>
                                <TableHead className="w-[100px] text-right p-2">Qtde. Original</TableHead>
                                <TableHead className="w-[100px] text-right p-2">Qtde. Simulada</TableHead>
                                <TableHead className="text-right p-2">Custo Líquido (NF-e)</TableHead>
                                <TableHead className="text-right p-2">Custos Adicionais/Un.</TableHead>
                                <TableHead className="text-right p-2">Custo Un. Final</TableHead>
                                <TableHead className="text-right p-2">Custo Total Orig.</TableHead>
                                <TableHead className="text-right font-bold text-primary p-2">Custo Total Sim.</TableHead>
                                <TableHead className="w-[50px] p-2"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs p-2">{item.description}</TableCell>
                                    <TableCell className="text-right p-2">{formatNumber(item.originalQuantity)}</TableCell>
                                    <TableCell className="p-2">
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 text-right"
                                            value={item.simulatedQuantity}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right p-2">{formatCurrency(item.unitCost)}</TableCell>
                                    <TableCell className="text-right p-2 text-red-500">{formatCurrency(item.additionalCosts)}</TableCell>
                                    <TableCell className="text-right p-2 font-bold">{formatCurrency(item.finalUnitCost)}</TableCell>
                                    <TableCell className="text-right p-2">{formatCurrency(item.originalTotalCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary p-2">{formatCurrency(item.simulatedTotalCost)}</TableCell>
                                    <TableCell className="p-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={6} className="text-right p-2">Totais:</TableCell>
                                <TableCell className="text-right p-2">{formatCurrency(totals.originalTotalCost)}</TableCell>
                                <TableCell className="text-right text-primary p-2">{formatCurrency(totals.simulatedTotalCost)}</TableCell>
                                <TableCell className="p-2"></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}
