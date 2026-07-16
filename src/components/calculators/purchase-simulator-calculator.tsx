
'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Trash2, Save, Search, Edit, Loader2, X, RefreshCw, Calculator, ShoppingCart, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4, formatNumber4 } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { PurchaseSimulation } from "@/lib/types";
import * as db from '@/lib/db';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { format as formatDate, parseISO, addDays } from "date-fns";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SimulatedItem {
    id: string;
    cProd: string;
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
    vIBS: number;
    vCBS: number;
}

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export default function PurchaseSimulatorCalculator() {
    const { currentNfe } = useNfeStore();
    const [items, setItems] = useState<SimulatedItem[]>([]);
    const [simulationName, setSimulationName] = useState("");
    const [originalNfeTotalCost, setOriginalNfeTotalCost] = useState(0);
    const [editingSimulationId, setEditingSimulationId] = useState<number | null>(null);

    const [savedSimulations, setSavedSimulations] = useState<PurchaseSimulation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [savedSimsDateRange, setSavedSimsDateRange] = useState<DateRange | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<PurchaseSimulation | null>(null);
    const [isLoadingSims, setIsLoadingSims] = useState(true);
    const [activeTab, setActiveTab] = useState("simulator");
    
    const [manualFrete, setManualFrete] = useState("");
    const [manualSeguro, setManualSeguro] = useState("");
    const [manualOutros, setManualOutros] = useState("");
    const [manualDesconto, setManualDesconto] = useState("");
    const [useTaxReform, setUseTaxReform] = useState(false);

    const { toast } = useToast();

    const loadSimulations = useCallback(async () => {
        setIsLoadingSims(true);
        try {
            const sims = await db.getAllSimulations();
            setSavedSimulations(sims.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
        } catch {
            toast({ title: "Erro", description: "Não foi possível carregar as simulações salvas.", variant: "destructive" });
        } finally {
            setIsLoadingSims(false);
        }
    }, [toast]);

    useEffect(() => {
        loadSimulations();
    }, [loadSimulations]);

    const calculateCosts = useCallback((item: Omit<SimulatedItem, 'id' | 'cProd' | 'description' | 'finalUnitCost' | 'originalTotalCost' | 'simulatedTotalCost'>, taxReform: boolean) => {
        const taxReformValue = taxReform ? (item.vIBS + item.vCBS) : 0;
        const totalAdditionalCosts = item.ipi + item.icmsST + item.frete + item.seguro + item.outras + taxReformValue - item.desconto;
        const additionalCostsPerUnit = item.originalQuantity > 0 ? totalAdditionalCosts / item.originalQuantity : 0;

        const finalUnitCost = item.unitCost + additionalCostsPerUnit;
        const originalTotalCost = finalUnitCost * item.originalQuantity;
        const simulatedTotalCost = finalUnitCost * (parseFloat(item.simulatedQuantity) || 0);

        return { additionalCosts: additionalCostsPerUnit, finalUnitCost, originalTotalCost, simulatedTotalCost };
    }, []);

    useEffect(() => {
        if (!currentNfe) {
            setItems([]);
            setOriginalNfeTotalCost(0);
            return;
        }

        const totalProdValue = currentNfe.totals.vProd || 0;
        let calculatedOriginalTotal = 0;

        const newItems: SimulatedItem[] = currentNfe.items.map((item, index) => {
            const itemWeight = totalProdValue > 0 ? item.vProd / totalProdValue : 0;
            
            const baseItem = {
                originalQuantity: item.qCom,
                simulatedQuantity: item.qCom.toString(),
                unitCost: item.vUnCom,
                additionalCosts: 0,
                ipi: item.taxes.vIPI || 0,
                icmsST: item.taxes.vICMSST || 0,
                frete: item.vFrete || (currentNfe.totals.vFrete * itemWeight),
                seguro: item.vSeg || (currentNfe.totals.vSeg * itemWeight),
                desconto: item.vDesc || (currentNfe.totals.vDesc * itemWeight),
                outras: item.vOutro || (currentNfe.totals.vOutro * itemWeight),
                vIBS: item.taxes.vIBS || 0,
                vCBS: item.taxes.vCBS || 0
            };

            const costs = calculateCosts(baseItem, useTaxReform);
            calculatedOriginalTotal += costs.originalTotalCost;

            return {
                id: `${currentNfe.header.chave}-${index}`,
                cProd: item.cProd,
                description: item.xProd,
                ...baseItem,
                ...costs
            };
        });

        setItems(newItems);
        setOriginalNfeTotalCost(calculatedOriginalTotal);
        setSimulationName(`Simulação NF-${currentNfe.header.nNF || 'S/N'} (${currentNfe.emit.xNome})`);
        
        toast({
            title: "Simulador Pronto",
            description: `${newItems.length} itens carregados da nota fiscal.`,
        });
    }, [currentNfe, calculateCosts, useTaxReform, toast]);

    const toggleTaxReform = (checked: boolean) => {
        setUseTaxReform(checked);
        setItems(prevItems => prevItems.map(item => {
            const costs = calculateCosts(item, checked);
            return { ...item, ...costs };
        }));
    };

    const applyManualRateio = () => {
        setItems(prevItems => {
            const totalProdValue = prevItems.reduce((acc, item) => acc + (item.unitCost * item.originalQuantity), 0);
            const mFrete = parseFloat(manualFrete) || 0;
            const mSeg = parseFloat(manualSeguro) || 0;
            const mOutros = parseFloat(manualOutros) || 0;
            const mDesc = parseFloat(manualDesconto) || 0;

            if (totalProdValue === 0) return prevItems;

            return prevItems.map(item => {
                const itemTotalValue = item.unitCost * item.originalQuantity;
                const itemWeight = totalProdValue > 0 ? itemTotalValue / totalProdValue : 0;
                
                const updatedItem = {
                    ...item,
                    frete: manualFrete ? (mFrete * itemWeight) : item.frete,
                    seguro: manualSeguro ? (mSeg * itemWeight) : item.seguro,
                    outras: manualOutros ? (mOutros * itemWeight) : item.outras,
                    desconto: manualDesconto ? (mDesc * itemWeight) : item.desconto,
                };
                const costs = calculateCosts(updatedItem, useTaxReform);
                return { ...updatedItem, ...costs };
            });
        });
        toast({ title: "Rateio Aplicado", description: "Custos atualizados proporcionalmente." });
    };

    const handleQuantityChange = (id: string, value: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const simulatedQuantity = value;
                const simulatedTotalCost = item.finalUnitCost * (parseFloat(simulatedQuantity) || 0);
                return { ...item, simulatedQuantity, simulatedTotalCost };
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        toast({ title: "Item removido da simulação." });
    };

    const clearData = useCallback(() => {
        setItems([]);
        setSimulationName("");
        setOriginalNfeTotalCost(0);
        setEditingSimulationId(null);
        setManualFrete("");
        setManualSeguro("");
        setManualOutros("");
        setManualDesconto("");
    }, []);

    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.simulatedTotalCost += item.simulatedTotalCost;
            return acc;
        }, { simulatedTotalCost: 0 });
    }, [items]);

    const handleSaveSimulation = async () => {
        if (!currentNfe || !simulationName) {
            toast({ title: "Erro", description: "Dados insuficientes para salvar a simulação.", variant: "destructive" });
            return;
        }

        const simulationData = {
            simulationName: simulationName,
            nfeInfo: {
                emitterName: currentNfe.emit.xNome,
                emitterCnpj: currentNfe.emit.CNPJ,
                emitterCity: `${currentNfe.emit.enderEmit?.xMun || ''} - ${currentNfe.emit.enderEmit?.UF || ''}`,
                nfeNumber: currentNfe.header.nNF || 'S/N',
            },
            items: items.map(i => ({
                code: i.cProd,
                description: i.description,
                originalQuantity: i.originalQuantity,
                simulatedQuantity: i.simulatedQuantity,
                finalUnitCost: i.finalUnitCost,
            })),
            originalTotalCost: originalNfeTotalCost,
            simulatedTotalCost: totals.simulatedTotalCost,
            createdAt: new Date().toISOString(),
        };

        try {
            if (editingSimulationId) {
                await db.updateSimulation({ ...simulationData, id: editingSimulationId });
                toast({ title: "Atualizado!", description: `Simulação "${simulationName}" atualizada.` });
            } else {
                await db.addSimulation(simulationData);
                toast({ title: "Salvo!", description: `Simulação "${simulationName}" salva.` });
            }
            loadSimulations();
            setActiveTab("saved");
            clearData();
        } catch {
            toast({ title: "Erro ao Salvar", variant: "destructive" });
        }
    }

    const filteredSimulations = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        return savedSimulations.filter(sim => {
            const { from, to } = savedSimsDateRange || {};
            if (from && parseISO(sim.createdAt) < from) return false;
            if (to && parseISO(sim.createdAt) >= addDays(to, 1)) return false;

            if (!lowerCaseQuery) return true;
            return (
                sim.simulationName.toLowerCase().includes(lowerCaseQuery) ||
                sim.nfeInfo.emitterName.toLowerCase().includes(lowerCaseQuery) ||
                sim.nfeInfo.nfeNumber.includes(lowerCaseQuery)
            );
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
        setSimulationName(sim.simulationName);
        setOriginalNfeTotalCost(sim.originalTotalCost);
        setEditingSimulationId(sim.id!);

        const loadedItems: SimulatedItem[] = sim.items.map((item, index) => {
            const simulatedTotalCost = item.finalUnitCost * (parseFloat(item.simulatedQuantity) || 0);
            const originalTotalCost = item.finalUnitCost * item.originalQuantity;

            return {
                id: `saved-${sim.id}-${index}`,
                cProd: item.code,
                description: item.description,
                originalQuantity: item.originalQuantity,
                simulatedQuantity: item.simulatedQuantity,
                unitCost: item.finalUnitCost,
                additionalCosts: 0,
                ipi: 0, icmsST: 0, frete: 0, seguro: 0, desconto: 0, outras: 0,
                finalUnitCost: item.finalUnitCost,
                originalTotalCost,
                simulatedTotalCost,
                vIBS: 0,
                vCBS: 0
            };
        });

        setItems(loadedItems);
        setActiveTab("simulator");
        toast({ title: "Simulação Carregada" });
    };

    const handleDeleteSimulation = async () => {
        if (!deleteTarget) return;
        try {
            await db.deleteSimulation(deleteTarget.id!);
            toast({ title: "Excluída" });
            setDeleteTarget(null);
            loadSimulations();
        } catch {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    };

    const generatePdf = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        doc.setFontSize(18);
        doc.text("Simulação de Compra - Synergia OS", 14, 22);

        if (currentNfe) {
            doc.setFontSize(10);
            doc.text(`NF-e: ${currentNfe.header.nNF || 'S/N'} | Fornecedor: ${currentNfe.emit.xNome}`, 14, 32);
        }

        const head = [['Cód.', 'Descrição', 'Qtde Orig.', 'Qtde Sim.', 'Custo Un.', 'Total Orig.', 'Total Sim.']];
        const body = items.map(item => [
            item.cProd,
            item.description,
            formatNumber4(item.originalQuantity),
            formatNumber4(parseFloat(item.simulatedQuantity) || 0),
            formatCurrency4(item.finalUnitCost),
            formatCurrency(item.originalTotalCost),
            formatCurrency(item.simulatedTotalCost),
        ]);

        autoTable(doc, {
            startY: 40,
            head,
            body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            foot: [['Total:', '', '', '', '', formatCurrency(originalNfeTotalCost), formatCurrency(totals.simulatedTotalCost)]],
            footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [0, 0, 0] },
        });

        doc.save(`simulacao_${currentNfe?.header.nNF || 'manual'}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted/50 backdrop-blur-sm border p-1 rounded-2xl">
                    <TabsTrigger value="simulator" className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all">Simulador</TabsTrigger>
                    <TabsTrigger value="saved" className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="simulator" className="space-y-6 mt-0">
                    {/* Toolbar Padronizada */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                <Calculator className="w-6 h-6 text-primary" />
                                Simulador de Compras
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold opacity-70">Projeção de Custos e Ajuste de Lote</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <NfeUploader />
                            {items.length > 0 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                         <Button variant="outline" className="shadow-sm border-primary/20 text-primary hover:bg-primary/5 font-black rounded-xl h-10 transition-all">
                                             <Save className="mr-2 h-4 w-4" /> Salvar Projeção
                                         </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Salvar Simulação</DialogTitle>
                                            <DialogDescription>Dê um nome para identificar esta simulação posteriormente.</DialogDescription>
                                        </DialogHeader>
                                         <div className="py-4">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground opacity-70 mb-2 block tracking-widest">Identificação da Simulação</Label>
                                            <Input value={simulationName} onChange={(e) => setSimulationName(e.target.value)} placeholder="Ex: Projeção Estoque Mínimo" className="h-11 font-black bg-background border-border" />
                                        </div>
                                         <DialogFooter>
                                            <Button onClick={handleSaveSimulation} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-11">
                                                Confirmar e Salvar
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>

                    {items.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-foreground text-background shadow-lg border-none overflow-hidden">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
                                            <ShoppingCart size={24} className="opacity-70" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase opacity-60">Total Original (NF)</span>
                                            <p className="text-2xl font-black">{formatCurrency(originalNfeTotalCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary text-primary-foreground shadow-lg border-none overflow-hidden">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-background/20 flex items-center justify-center shrink-0">
                                            <Calculator size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase opacity-80">Total Simulado</span>
                                            <p className="text-2xl font-black">{formatCurrency(totals.simulatedTotalCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-accent-green text-accent-green-foreground shadow-lg border-none overflow-hidden relative">
                                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                        <TrendingDown size={80} />
                                    </div>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-background/20 flex items-center justify-center shrink-0">
                                            <TrendingDown size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase opacity-80">Diferença / Economia</span>
                                            <p className="text-2xl font-black">{formatCurrency(originalNfeTotalCost - totals.simulatedTotalCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 bg-card p-5 rounded-2xl border shadow-sm border-border/50">
                                <div className="flex flex-1 items-center gap-4">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap opacity-70 tracking-widest">Rateio Global:</Label>
                                    <div className="grid grid-cols-4 gap-3 flex-1 max-w-lg">
                                        <div className="space-y-1">
                                            <Input placeholder="Frete" value={manualFrete} onChange={e => setManualFrete(e.target.value)} className="h-10 text-xs font-black bg-background border-border focus:ring-2 focus:ring-primary/20 transition-all text-center" />
                                        </div>
                                        <div className="space-y-1">
                                            <Input placeholder="Seguro" value={manualSeguro} onChange={e => setManualSeguro(e.target.value)} className="h-10 text-xs font-black bg-background border-border focus:ring-2 focus:ring-primary/20 transition-all text-center" />
                                        </div>
                                        <div className="space-y-1">
                                            <Input placeholder="Outros" value={manualOutros} onChange={e => setManualOutros(e.target.value)} className="h-10 text-xs font-black bg-background border-border focus:ring-2 focus:ring-primary/20 transition-all text-center" />
                                        </div>
                                        <div className="space-y-1">
                                            <Input placeholder="Desconto" value={manualDesconto} onChange={e => setManualDesconto(e.target.value)} className="h-10 text-xs font-black bg-background border-destructive/30 focus:border-destructive focus:ring-2 focus:ring-destructive/10 transition-all text-center" />
                                        </div>
                                    </div>
                                    <Button onClick={applyManualRateio} size="sm" variant="default" className="h-10 font-black text-[10px] uppercase px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">Aplicar Rateio</Button>
                                </div>
                                <div className="h-8 w-[1px] bg-border/50 hidden md:block"></div>
                                <div className="flex items-center gap-3">
                                    <Label className="text-[10px] font-black uppercase text-primary">Reforma (IBS/CBS)</Label>
                                    <Switch checked={useTaxReform} onCheckedChange={toggleTaxReform} />
                                </div>
                            </div>

                             <div className="rounded-xl border border-border shadow-xl overflow-hidden bg-card text-foreground">
                                 <Table>
                                     <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                            <TableHead className="w-[120px] text-[10px] font-black uppercase text-muted-foreground opacity-70">Cód. Forn.</TableHead>
                                            <TableHead className="min-w-[200px] text-[10px] font-black uppercase text-muted-foreground opacity-70">Descrição</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground opacity-70">Qtde Orig.</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-primary">Qtde Sim.</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground opacity-70">Custo Un. Final</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground opacity-70">Total Orig.</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-primary">Total Sim.</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                     <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group border-b border-border/50">
                                                <TableCell className="font-mono text-[10px] font-black text-muted-foreground opacity-60">{item.cProd}</TableCell>
                                                <TableCell className="text-xs font-black">{item.description}</TableCell>
                                                <TableCell className="text-right text-xs font-black text-muted-foreground opacity-60">{formatNumber4(item.originalQuantity)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        value={item.simulatedQuantity}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        className="h-9 w-24 ml-auto text-right font-black text-xs bg-primary/5 border-primary/20 focus:bg-background focus:ring-primary/20"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-mono font-black">{formatCurrency4(item.finalUnitCost)}</TableCell>
                                                <TableCell className="text-right text-xs font-black text-muted-foreground opacity-60">{formatCurrency(item.originalTotalCost)}</TableCell>
                                                <TableCell className="text-right text-xs font-black text-primary">{formatCurrency(item.simulatedTotalCost)}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter className="bg-muted/20">
                                        <TableRow>
                                            <TableHead colSpan={5} className="text-right text-[10px] font-black uppercase opacity-60">Totais da Projeção:</TableHead>
                                            <TableCell className="text-right text-xs font-bold">{formatCurrency(originalNfeTotalCost)}</TableCell>
                                            <TableCell className="text-right text-xs font-black text-primary">{formatCurrency(totals.simulatedTotalCost)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button onClick={generatePdf} variant="outline" className="shadow-sm border-border hover:bg-muted font-black rounded-xl">
                                    <Printer className="mr-2 h-4 w-4" /> Exportar PDF
                                </Button>
                                <Button onClick={clearData} variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 font-black rounded-xl">
                                    <X className="mr-2 h-4 w-4" /> Descartar Tudo
                                </Button>
                            </div>
                        </>
                    )}

                    {!currentNfe && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-border text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-black text-foreground">Pronto para Simular?</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2 font-medium">Importe uma NF-e para projetar custos baseados em diferentes quantidades de compra e rateios personalizados.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="saved" className="space-y-6 mt-0">
                    <Card className="border border-border shadow-xl bg-card text-foreground overflow-hidden rounded-2xl">
                        <CardHeader className="bg-muted/30 pb-8 border-b border-border">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black">Histórico de Simulações</CardTitle>
                                    <CardDescription className="font-medium">Gestão de projeções salvas e análise de economia acumulada.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar por NF-e ou Fornecedor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10 bg-background border-border font-black text-xs" />
                                    </div>
                                    <DatePickerWithRange date={savedSimsDateRange} setDate={setSavedSimsDateRange} />
                                    <Button onClick={() => { setSearchQuery(""); setSavedSimsDateRange(undefined); }} variant="ghost" size="icon" className="h-10 w-10">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingSims ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                            ) : (
                                <div className="rounded-xl border border-border overflow-hidden bg-card">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-border">
                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground opacity-70">Simulação</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground opacity-70">Fornecedor</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center text-muted-foreground opacity-70">NF-e</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center text-muted-foreground opacity-70">Data</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right text-primary">Economia</TableHead>
                                                <TableHead className="w-32 text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSimulations.length > 0 ? filteredSimulations.map(sim => (
                                                <TableRow key={sim.id} className="hover:bg-muted/30 border-b border-border/50">
                                                    <TableCell className="font-black text-xs">{sim.simulationName}</TableCell>
                                                    <TableCell className="text-xs font-medium">{sim.nfeInfo.emitterName}</TableCell>
                                                    <TableCell className="text-center font-mono text-[10px] font-black">#{sim.nfeInfo.nfeNumber}</TableCell>
                                                    <TableCell className="text-center text-[10px] font-black">{formatDate(parseISO(sim.createdAt), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="text-right text-xs font-black text-accent-green">{formatCurrency(sim.originalTotalCost - sim.simulatedTotalCost)}</TableCell>
                                                    <TableCell className="text-right flex gap-1 justify-end p-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleLoadSimulation(sim)} className="h-8 w-8 p-0 rounded-lg">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(sim)} className="h-8 w-8 p-0 text-destructive rounded-lg">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground italic font-medium">Nenhuma simulação encontrada no período.</TableCell></TableRow>
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
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Simulação?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é irreversível e removerá permanentemente os dados de &quot;{deleteTarget?.simulationName}&quot; do seu banco de dados local.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-black">Manter</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSimulation} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black text-destructive-foreground">Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
