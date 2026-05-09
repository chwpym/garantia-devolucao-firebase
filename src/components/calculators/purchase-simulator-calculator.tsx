
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
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-slate-100 dark:bg-slate-900">
                    <TabsTrigger value="simulator" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Simulador</TabsTrigger>
                    <TabsTrigger value="saved" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Histórico de Simulações</TabsTrigger>
                </TabsList>

                <TabsContent value="simulator" className="space-y-6 mt-0">
                    {/* Toolbar Padronizada */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Calculator className="w-6 h-6 text-indigo-600" />
                                Simulador de Compras
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Projeção de Custos e Ajuste de Lote</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <NfeUploader />
                            {items.length > 0 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="shadow-sm border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                            <Save className="mr-2 h-4 w-4" /> Salvar Projeção
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Salvar Simulação</DialogTitle>
                                            <DialogDescription>Dê um nome para identificar esta simulação posteriormente.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Identificação</Label>
                                            <Input value={simulationName} onChange={(e) => setSimulationName(e.target.value)} placeholder="Ex: Projeção Estoque Mínimo" className="h-11" />
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleSaveSimulation} className="w-full bg-indigo-600 hover:bg-indigo-700">
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
                            {/* Cards de Resumo Modernos */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-slate-900 text-white shadow-lg border-none overflow-hidden">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <ShoppingCart size={24} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase opacity-60">Total Original (NF)</span>
                                            <p className="text-2xl font-black">{formatCurrency(originalNfeTotalCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-indigo-600 text-white shadow-lg border-none overflow-hidden">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                            <Calculator size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase opacity-80">Total Simulado</span>
                                            <p className="text-2xl font-black">{formatCurrency(totals.simulatedTotalCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-emerald-600 text-white shadow-lg border-none overflow-hidden relative">
                                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                        <TrendingDown size={80} />
                                    </div>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                            <TrendingDown size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase opacity-80">Diferença / Economia</span>
                                            <p className="text-2xl font-black">{formatCurrency(originalNfeTotalCost - totals.simulatedTotalCost)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Controles de Ajuste Fino */}
                            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm">
                                <div className="flex flex-1 items-center gap-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Ajuste Global:</Label>
                                    <div className="grid grid-cols-4 gap-2 flex-1 max-w-md">
                                        <Input placeholder="Frete" value={manualFrete} onChange={e => setManualFrete(e.target.value)} className="h-8 text-[11px] font-bold" />
                                        <Input placeholder="Seguro" value={manualSeguro} onChange={e => setManualSeguro(e.target.value)} className="h-8 text-[11px] font-bold" />
                                        <Input placeholder="Outros" value={manualOutros} onChange={e => setManualOutros(e.target.value)} className="h-8 text-[11px] font-bold" />
                                        <Input placeholder="Desconto" value={manualDesconto} onChange={e => setManualDesconto(e.target.value)} className="h-8 text-[11px] font-bold border-rose-200" />
                                    </div>
                                    <Button onClick={applyManualRateio} size="sm" variant="secondary" className="h-8 font-black text-[10px] uppercase">Aplicar</Button>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>
                                <div className="flex items-center gap-3">
                                    <Label className="text-[10px] font-black uppercase text-indigo-600">Reforma (IBS/CBS)</Label>
                                    <Switch checked={useTaxReform} onCheckedChange={toggleTaxReform} />
                                </div>
                            </div>

                            {/* Tabela de Simulação */}
                            <div className="rounded-xl border shadow-xl overflow-hidden bg-white dark:bg-slate-950">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50">
                                            <TableHead className="w-[120px] text-[10px] font-black uppercase text-slate-500">Cód. Forn.</TableHead>
                                            <TableHead className="min-w-[200px] text-[10px] font-black uppercase text-slate-500">Descrição</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Qtde Orig.</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-indigo-600">Qtde Sim.</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Custo Un. Final</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Total Orig.</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase text-indigo-600">Total Sim.</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <TableCell className="font-mono text-[10px] font-bold text-slate-400">{item.cProd}</TableCell>
                                                <TableCell className="text-xs font-medium">{item.description}</TableCell>
                                                <TableCell className="text-right text-xs font-bold text-slate-400">{formatNumber4(item.originalQuantity)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        value={item.simulatedQuantity}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        className="h-8 w-24 ml-auto text-right font-black text-xs bg-indigo-50/50 border-indigo-100 focus:bg-white"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-mono">{formatCurrency4(item.finalUnitCost)}</TableCell>
                                                <TableCell className="text-right text-xs text-slate-400">{formatCurrency(item.originalTotalCost)}</TableCell>
                                                <TableCell className="text-right text-xs font-black text-indigo-600">{formatCurrency(item.simulatedTotalCost)}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter className="bg-slate-900 text-white">
                                        <TableRow>
                                            <TableHead colSpan={5} className="text-right text-[10px] font-black uppercase opacity-60">Totais da Projeção:</TableHead>
                                            <TableCell className="text-right text-xs font-bold">{formatCurrency(originalNfeTotalCost)}</TableCell>
                                            <TableCell className="text-right text-xs font-black text-indigo-400">{formatCurrency(totals.simulatedTotalCost)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button onClick={generatePdf} variant="outline" className="shadow-sm">
                                    <Printer className="mr-2 h-4 w-4" /> Exportar PDF da Projeção
                                </Button>
                                <Button onClick={clearData} variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                    <X className="mr-2 h-4 w-4" /> Descartar Tudo
                                </Button>
                            </div>
                        </>
                    )}

                    {!currentNfe && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-muted-foreground/10 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8 text-slate-400 opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Pronto para Simular?</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">Importe uma NF-e para projetar custos baseados em diferentes quantidades de compra e rateios personalizados.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="saved" className="space-y-6 mt-0">
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-950 overflow-hidden rounded-2xl">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 pb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black">Histórico de Simulações</CardTitle>
                                    <CardDescription>Gestão de projeções salvas e análise de economia acumulada.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar por NF-e ou Fornecedor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10 bg-white" />
                                    </div>
                                    <DatePickerWithRange date={savedSimsDateRange} setDate={setSavedSimsDateRange} />
                                    <Button onClick={() => { setSearchQuery(""); setSavedSimsDateRange(undefined); }} variant="ghost" size="icon" className="h-10 w-10">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoadingSims ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>
                            ) : (
                                <div className="rounded-xl border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead className="text-[10px] font-black uppercase">Simulação</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Fornecedor</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">NF-e</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Data</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Economia</TableHead>
                                                <TableHead className="w-32 text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSimulations.length > 0 ? filteredSimulations.map(sim => (
                                                <TableRow key={sim.id} className="hover:bg-slate-50/50">
                                                    <TableCell className="font-bold text-xs">{sim.simulationName}</TableCell>
                                                    <TableCell className="text-xs">{sim.nfeInfo.emitterName}</TableCell>
                                                    <TableCell className="text-center font-mono text-[10px]">#{sim.nfeInfo.nfeNumber}</TableCell>
                                                    <TableCell className="text-center text-[10px]">{formatDate(parseISO(sim.createdAt), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="text-right text-xs font-black text-emerald-600">{formatCurrency(sim.originalTotalCost - sim.simulatedTotalCost)}</TableCell>
                                                    <TableCell className="text-right flex gap-1 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => handleLoadSimulation(sim)} className="h-8 w-8 p-0">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(sim)} className="h-8 w-8 p-0 text-rose-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground italic">Nenhuma simulação encontrada no período.</TableCell></TableRow>
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
                        <AlertDialogCancel className="rounded-xl">Manter</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSimulation} className="bg-rose-500 hover:bg-rose-600 rounded-xl">Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
