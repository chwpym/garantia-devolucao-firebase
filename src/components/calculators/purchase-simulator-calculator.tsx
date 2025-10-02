

"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Printer, Trash2, Save, Search, Edit, Loader2, X, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { NfeInfo, PurchaseSimulation } from "@/lib/types";
import * as db from '@/lib/db';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { format as formatDate, parseISO, addDays } from "date-fns";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";


interface SimulatedItem {
    id: number;
    description: string;
    originalQuantity: number;
    simulatedQuantity: string;
    unitCost: number; 
    additionalCosts: number; 
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

interface NfeProductDetail {
    prod: Record<string, string>;
    imposto: Record<string, Record<string, Record<string, string>>>;
}

interface InfNFe {
    ['@_Id']: string;
    ide: { nNF: string };
    emit: { xNome: string; CNPJ: string, enderEmit: { xLgr: string, nro: string, xBairro: string, xMun: string, UF: string } };
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

const formatCnpj = (value?: string | number) => {
    if (!value) return '-';
    const cleaned = String(value).replace(/\D/g, '');
    if (cleaned.length === 14) { // CNPJ
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return String(value);
};


export default function PurchaseSimulatorCalculator() {
    const [items, setItems] = useState<SimulatedItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
    const [simulationName, setSimulationName] = useState("");
    const [originalNfeTotalCost, setOriginalNfeTotalCost] = useState(0);
    const [editingSimulationId, setEditingSimulationId] = useState<number | null>(null);

    const [savedSimulations, setSavedSimulations] = useState<PurchaseSimulation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [savedSimsDateRange, setSavedSimsDateRange] = useState<DateRange | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<PurchaseSimulation | null>(null);
    const [isLoadingSims, setIsLoadingSims] = useState(true);
    const [activeTab, setActiveTab] = useState("simulator");

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSimulations = useCallback(async () => {
        setIsLoadingSims(true);
        try {
            const sims = await db.getAllSimulations();
            setSavedSimulations(sims.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
        } catch {
             toast({ title: "Erro", description: "Não foi possível carregar as simulações salvas.", variant: "destructive" });
        } finally {
            setIsLoadingSims(false);
        }
    }, [toast]);

    useEffect(() => {
        loadSimulations();
    }, [loadSimulations]);

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

        clearData(); // Clear previous simulation before importing a new one
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

                const newNfeInfo = {
                    emitterName: infNFe.emit.xNome,
                    emitterCnpj: infNFe.emit.CNPJ,
                    emitterCity: `${infNFe.emit.enderEmit.xMun} - ${infNFe.emit.enderEmit.UF}`,
                    nfeNumber: infNFe.ide.nNF,
                };
                setNfeInfo(newNfeInfo);
                setSimulationName(`Simulação NF-${newNfeInfo.nfeNumber} (${newNfeInfo.emitterName})`);

                let calculatedOriginalTotal = 0;

                const newItems: SimulatedItem[] = dets.map((det, index) => {
                    const prod = det.prod;
                    const imposto = det.imposto;
                    const itemTotalCost = parseFloat(prod.vProd);
                    const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;
                    
                    const baseItem: Omit<SimulatedItem, 'id' | 'description' | 'finalUnitCost' | 'originalTotalCost' | 'simulatedTotalCost'> = {
                        originalQuantity: parseFloat(prod.qCom),
                        simulatedQuantity: prod.qCom,
                        unitCost: parseFloat(prod.vUnCom),
                        additionalCosts: 0, // Placeholder, will be calculated
                        ipi: parseFloat(imposto?.IPI?.IPITrib?.vIPI) || 0,
                        icmsST: parseFloat(imposto?.ICMS?.ICMSST?.vICMSST) || 0,
                        frete: (parseFloat(total.vFrete) || 0) * itemWeight,
                        seguro: (parseFloat(total.vSeg) || 0) * itemWeight,
                        desconto: (parseFloat(total.vDesc) || 0) * itemWeight,
                        outras: (parseFloat(total.vOutro) || 0) * itemWeight,
                    };
                    
                    const costs = calculateCosts(baseItem);
                    calculatedOriginalTotal += costs.originalTotalCost;

                    return {
                        id: Date.now() + index,
                        description: prod.xProd,
                        ...baseItem,
                        ...costs,
                    };
                });
                
                setItems(newItems);
                setOriginalNfeTotalCost(calculatedOriginalTotal);

                toast({ title: "Sucesso!", description: `${newItems.length} itens importados da NF-e.` });
            } catch (error) {
                console.error("Erro ao processar o XML:", error);
                clearData();
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

    const clearData = useCallback(() => {
        setItems([]);
        setFileName(null);
        setNfeInfo(null);
        setSimulationName("");
        setOriginalNfeTotalCost(0);
        setEditingSimulationId(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }, []);
    
    const handleClearSearch = () => {
        setSearchQuery("");
        setSavedSimsDateRange(undefined);
    };

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.simulatedTotalCost += item.simulatedTotalCost;
            return acc;
        }, { simulatedTotalCost: 0 });
    }, [items]);

    const handleSaveSimulation = async () => {
        if (!nfeInfo || !simulationName) {
            toast({ title: "Erro", description: "Dados insuficientes para salvar a simulação.", variant: "destructive"});
            return;
        }

        const simulationData: Omit<PurchaseSimulation, 'id' | 'createdAt'> & { id?: number, createdAt?: string } = {
            id: editingSimulationId || undefined,
            simulationName: simulationName,
            nfeInfo: nfeInfo,
            items: items.map(i => ({
                description: i.description,
                originalQuantity: i.originalQuantity,
                simulatedQuantity: i.simulatedQuantity,
                finalUnitCost: i.finalUnitCost,
            })),
            originalTotalCost: originalNfeTotalCost,
            simulatedTotalCost: totals.simulatedTotalCost,
        };

        try {
            if (editingSimulationId) {
                await db.updateSimulation({ ...simulationData, id: editingSimulationId, createdAt: new Date().toISOString() });
                toast({ title: "Sucesso!", description: `Simulação "${simulationName}" foi atualizada.`});
            } else {
                await db.addSimulation({ ...simulationData, createdAt: new Date().toISOString() });
                toast({ title: "Sucesso!", description: `Simulação "${simulationName}" foi salva.`});
            }
            loadSimulations();
            setActiveTab("saved");
            clearData();
        } catch (error) {
            console.error(error)
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a simulação.", variant: "destructive"});
        }
    }

    const filteredSimulations = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();

        return savedSimulations.filter(sim => {
             // Date filter
            const { from, to } = savedSimsDateRange || {};
            if (from && sim.createdAt) {
                if (parseISO(sim.createdAt) < from) return false;
            }
            if (to && sim.createdAt) {
                const toDate = addDays(to, 1);
                if (parseISO(sim.createdAt) >= toDate) return false;
            }

            // Search term filter
            if (!lowerCaseQuery) return true;

            return (
                sim.simulationName.toLowerCase().includes(lowerCaseQuery) ||
                sim.nfeInfo.emitterName.toLowerCase().includes(lowerCaseQuery) ||
                sim.nfeInfo.nfeNumber.includes(lowerCaseQuery)
            )
        });
    }, [savedSimulations, searchQuery, savedSimsDateRange]);
    
     const filteredTotals = useMemo(() => {
        return filteredSimulations.reduce((acc, sim) => {
            acc.original += sim.originalTotalCost;
            acc.simulated += sim.simulatedTotalCost;
            return acc;
        }, { original: 0, simulated: 0 });
    }, [filteredSimulations]);

    const handleLoadSimulation = (sim: PurchaseSimulation) => {
        setNfeInfo(sim.nfeInfo);
        setSimulationName(sim.simulationName);
        setFileName(`NF-${sim.nfeInfo.nfeNumber}.xml (Salva)`);
        setOriginalNfeTotalCost(sim.originalTotalCost);
        setEditingSimulationId(sim.id!);

        const loadedItems = sim.items.map((item, index) => {
            const simulatedTotalCost = item.finalUnitCost * (parseFloat(item.simulatedQuantity) || 0);
            const originalTotalCost = item.finalUnitCost * item.originalQuantity;
            
            const unitCostApproximation = item.finalUnitCost;
            const additionalCostsApproximation = 0;

            return {
                ...item,
                id: Date.now() + index, // Assign a temporary id for the UI
                ipi: 0, icmsST: 0, frete: 0, seguro: 0, desconto: 0, outras: 0,
                additionalCosts: additionalCostsApproximation,
                unitCost: unitCostApproximation,
                originalTotalCost,
                simulatedTotalCost
            };
        });
        
        setItems(loadedItems);
        setActiveTab("simulator");
        toast({ title: "Simulação Carregada", description: `"${sim.simulationName}" está pronta para edição.`});
    };

    const handleDeleteSimulation = async () => {
        if (!deleteTarget) return;
        try {
            await db.deleteSimulation(deleteTarget.id!);
            toast({ title: "Sucesso", description: "Simulação excluída."});
            setDeleteTarget(null);
            loadSimulations();
        } catch {
            toast({ title: "Erro", description: "Não foi possível excluir a simulação.", variant: "destructive"});
        }
    };


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
                ['Total:', '', '', '', formatCurrency(originalNfeTotalCost), formatCurrency(totals.simulatedTotalCost)]
            ],
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fontStyle: 'bold', fillColor: [224, 224, 224], textColor: [0, 0, 0] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(`Economia Potencial: ${formatCurrency(originalNfeTotalCost - totals.simulatedTotalCost)}`, 14, finalY);
    
        doc.save(`simulacao_compra_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
    };
    
    const generateSavedSimulationsPdf = () => {
        if (filteredSimulations.length === 0) {
            toast({ title: "Aviso", description: "Não há dados para exportar." });
            return;
        }
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let cursorY = 22;

        doc.setFontSize(18);
        doc.text("Relatório de Simulações Salvas", margin, cursorY);
        cursorY += 10;

        const cardWidth = (pageWidth - margin * 4) / 3;
        const cardHeight = 25;
        const cardY = cursorY;

        const drawCard = (x: number, title: string, value: string, valueColor: string = "#000000") => {
            doc.setDrawColor(224, 224, 224);
            doc.setFillColor(250, 250, 250);
            doc.rect(x, cardY, cardWidth, cardHeight, 'FD');
            
            doc.setFontSize(10);
            doc.setTextColor("#64748b");
            doc.text(title, x + cardWidth / 2, cardY + 8, { align: 'center' });
            
            doc.setFontSize(14).setFont('helvetica', 'bold');
            doc.setTextColor(valueColor);
           
            doc.text(value, x + cardWidth / 2, cardY + 18, { align: 'center' });
        };
        
        drawCard(margin, "Custo Total Original", formatCurrency(filteredTotals.original));
        drawCard(margin + cardWidth + margin, "Custo Total Simulado", formatCurrency(filteredTotals.simulated), "#600BE8"); // Primary color
        drawCard(margin + (cardWidth + margin) * 2, "Economia Potencial Total", formatCurrency(filteredTotals.original - filteredTotals.simulated), "#16A34A"); // Accent-green color

        cursorY += cardHeight + 15;


        const head = [['Nome da Simulação', 'Fornecedor', 'Nº NF-e', 'Custo Original', 'Custo Simulado', 'Economia']];
        const body = filteredSimulations.map(sim => [
            sim.simulationName,
            sim.nfeInfo.emitterName,
            sim.nfeInfo.nfeNumber,
            formatCurrency(sim.originalTotalCost),
            formatCurrency(sim.simulatedTotalCost),
            formatCurrency(sim.originalTotalCost - sim.simulatedTotalCost)
        ]);
        
        autoTable(doc, {
            startY: cursorY,
            head: head,
            body: body,
            foot: [
                ['Total:', '', '', formatCurrency(filteredTotals.original), formatCurrency(filteredTotals.simulated), formatCurrency(filteredTotals.original - filteredTotals.simulated)]
            ],
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fontStyle: 'bold', fillColor: [224, 224, 224], textColor: [0, 0, 0] },
        });

        doc.save(`relatorio_simulacoes_salvas.pdf`);
    };


    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simulator">Simulador</TabsTrigger>
                    <TabsTrigger value="saved">Simulações Salvas</TabsTrigger>
                </TabsList>
                <TabsContent value="simulator" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center">
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Importar XML da NF-e
                            </Button>
                            <Button onClick={generatePdf} variant="secondary" disabled={items.length === 0}>
                                <Printer className="mr-2 h-4 w-4" />
                                Gerar PDF
                            </Button>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" disabled={items.length === 0}>
                                        {editingSimulationId ? <RefreshCw className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                        {editingSimulationId ? 'Atualizar Simulação' : 'Salvar Simulação'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingSimulationId ? 'Atualizar Simulação' : 'Salvar Nova Simulação'}</DialogTitle>
                                        <DialogDescription>{editingSimulationId ? 'Confirme ou edite o nome e atualize esta simulação.' : 'Dê um nome para esta simulação para encontrá-la depois.'}</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label htmlFor="sim-name">Nome da Simulação</Label>
                                        <Input id="sim-name" value={simulationName} onChange={(e) => setSimulationName(e.target.value)} />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" onClick={handleSaveSimulation}>
                                            {editingSimulationId ? <RefreshCw className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                            {editingSimulationId ? 'Confirmar Atualização' : 'Salvar'}
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             {items.length > 0 && (
                                <Button onClick={clearData} variant="destructive">
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar
                                </Button>
                            )}
                            {fileName && (
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted flex-1 sm:flex-none justify-between">
                                    <span className="text-sm text-muted-foreground truncate" title={fileName}>{fileName}</span>
                                </div>
                            )}
                            <Input type="file" ref={fileInputRef} onChange={handleImportXml} className="hidden" accept=".xml" />
                        </div>

                        {nfeInfo && items.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações do Fornecedor</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                    <div><strong>Fornecedor:</strong> {nfeInfo.emitterName}</div>
                                    <div><strong>CNPJ:</strong> {formatCnpj(nfeInfo.emitterCnpj)}</div>
                                    <div><strong>Cidade:</strong> {nfeInfo.emitterCity}</div>
                                </CardContent>
                            </Card>
                        )}


                        {items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Custo Total Original</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(originalNfeTotalCost)}</div>
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
                                        <div className="text-2xl font-bold text-accent-green">{formatCurrency(originalNfeTotalCost - totals.simulatedTotalCost)}</div>
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
                                            <TableHead className="p-2 w-[120px]">Qtde. Simulada</TableHead>
                                            <TableHead className="text-right p-2 w-[120px]">Custo Líquido (NF-e)</TableHead>
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
                                                <TableCell className="w-[100px] text-right p-2">{formatNumber(item.originalQuantity)}</TableCell>
                                                <TableCell className="p-2 w-[120px]">
                                                    <Input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="h-8 text-right w-[100px]"
                                                        value={item.simulatedQuantity}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right p-2 w-[120px]">{formatCurrency(item.unitCost)}</TableCell>
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
                                            <TableCell className="text-right p-2">{formatCurrency(originalNfeTotalCost)}</TableCell>
                                            <TableCell className="text-right text-primary p-2">{formatCurrency(totals.simulatedTotalCost)}</TableCell>
                                            <TableCell className="p-2"></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="saved" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Simulações Salvas</CardTitle>
                            <CardDescription>
                                Consulte, edite ou exclua simulações de compra salvas anteriormente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Custo Total Original</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(filteredTotals.original)}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Custo Total Simulado</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-primary">{formatCurrency(filteredTotals.simulated)}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Economia Potencial Total</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-accent-green">{formatCurrency(filteredTotals.original - filteredTotals.simulated)}</div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="mb-4 flex flex-col md:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nome da simulação, fornecedor ou Nº da NF-e..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10"
                                    />
                                </div>
                                <DatePickerWithRange date={savedSimsDateRange} setDate={setSavedSimsDateRange} />
                                <Button onClick={handleClearSearch} variant="outline">
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar
                                </Button>
                                <Button onClick={generateSavedSimulationsPdf} variant="secondary" disabled={filteredSimulations.length === 0}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Exportar para PDF
                                </Button>
                            </div>
                            {isLoadingSims ? <Loader2 className="animate-spin" /> : (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome da Simulação</TableHead>
                                                <TableHead>Fornecedor</TableHead>
                                                <TableHead>Nº NF-e</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Economia Potencial</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSimulations.length > 0 ? filteredSimulations.map(sim => (
                                                <TableRow key={sim.id}>
                                                    <TableCell className="font-medium">{sim.simulationName}</TableCell>
                                                    <TableCell>{sim.nfeInfo.emitterName}</TableCell>
                                                    <TableCell>{sim.nfeInfo.nfeNumber}</TableCell>
                                                    <TableCell>{formatDate(parseISO(sim.createdAt), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="font-bold text-accent-green">{formatCurrency(sim.originalTotalCost - sim.simulatedTotalCost)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleLoadSimulation(sim)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Carregar
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(sim)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center h-24">Nenhuma simulação encontrada.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescriptionComponent>
                            Tem certeza que deseja excluir a simulação &quot;{deleteTarget?.simulationName}&quot;? Esta ação não pode ser desfeita.
                        </AlertDialogDescriptionComponent>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSimulation} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


