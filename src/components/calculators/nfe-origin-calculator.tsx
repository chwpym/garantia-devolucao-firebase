
'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info, FileText, Globe, HelpCircle, PackageSearch, Landmark } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ORIGEM_LEGENDA: Record<string, string> = {
    "0": "Nacional (Exceto as indicadas nos códigos 3, 4, 5 e 8)",
    "1": "Estrangeira - Importação direta (Exceto a do código 6)",
    "2": "Estrangeira - Adquirida no mercado interno (Exceto a do 7)",
    "3": "Nacional - Conteúdo de Importação superior a 40%",
    "4": "Nacional - Produção Processos Produtivos Básicos (PPB)",
    "5": "Nacional - Conteúdo de Importação inferior/igual a 40%",
    "6": "Estrangeira - Importação direta, sem similar nacional (CAMEX)",
    "7": "Estrangeira - Adquirida mercado interno, sem similar (CAMEX)",
    "8": "Nacional - Conteúdo de Importação superior a 70%"
};

interface OriginItem {
    id: string;
    cProd: string;
    description: string;
    ncm: string;
    orig: string;
    cst: string;
    cfop: string;
}

export default function NfeProductOriginCalculator() {
    const { currentNfe } = useNfeStore();
    const [items, setItems] = useState<OriginItem[]>([]);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!currentNfe) {
            setItems([]);
            return;
        }

        const newItems: OriginItem[] = currentNfe.items.map((item, index) => ({
            id: `${currentNfe.header.chave}-${index}`,
            cProd: item.cProd,
            description: item.xProd,
            ncm: item.NCM || "",
            orig: item.orig || "0",
            cst: item.CST || "",
            cfop: item.CFOP || ""
        }));

        setItems(newItems);
        toast({
            title: "Mapeamento de Origens",
            description: `${newItems.length} produtos da NF-e ${currentNfe.header.nNF} classificados.`,
        });
    }, [currentNfe, toast]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Padronizado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="w-6 h-6 text-emerald-600" />
                        Origem da Mercadoria
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Análise de Nacionalidade e Conteúdo de Importação</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsLegendOpen(true)} className="h-9 shadow-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        <HelpCircle className="mr-2 h-4 w-4" /> Legenda de Origens
                    </Button>
                    <NfeUploader />
                </div>
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-emerald-600 text-white shadow-lg border-none overflow-hidden relative">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <Globe size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase opacity-80">Nacionais</span>
                                <p className="text-2xl font-black">{items.filter(i => ['0', '3', '4', '5', '8'].includes(i.orig)).length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800 text-white shadow-lg border-none overflow-hidden relative">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                <PackageSearch size={24} className="text-emerald-400" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase opacity-80">Importados / Adq. Interno</span>
                                <p className="text-2xl font-black text-emerald-400">{items.filter(i => ['1', '2', '6', '7'].includes(i.orig)).length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-600 text-white shadow-lg border-none overflow-hidden relative">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <FileText size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase opacity-80">Total de Itens</span>
                                <p className="text-2xl font-black">{items.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {items.length > 0 ? (
                <div className="rounded-xl border shadow-xl overflow-hidden bg-white dark:bg-slate-950">
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="w-[120px] text-[10px] font-black uppercase text-slate-500">Cód. Forn.</TableHead>
                                    <TableHead className="min-w-[250px] text-[10px] font-black uppercase text-slate-500">Descrição do Produto</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">NCM</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Origem (Tabela A)</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">CST/CFOP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                                        <TableCell className="font-mono text-[10px] font-bold text-emerald-600">{item.cProd}</TableCell>
                                        <TableCell className="text-xs font-medium">{item.description}</TableCell>
                                        <TableCell className="text-center font-mono text-[10px] text-slate-400">{item.ncm}</TableCell>
                                        <TableCell className="text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant={['0', '4', '5'].includes(item.orig) ? "secondary" : "default"} className="h-6 w-6 p-0 flex items-center justify-center font-black">
                                                            {item.orig}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs p-3 rounded-xl border-none shadow-2xl bg-slate-900 text-white">
                                                        <p className="text-[10px] font-bold uppercase border-b border-white/10 mb-1 pb-1">Origem do Produto</p>
                                                        <p className="text-xs leading-tight">{ORIGEM_LEGENDA[item.orig] || "Não identificada"}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-mono font-black text-slate-800 dark:text-slate-200">{item.cst}</span>
                                                <span className="text-[9px] text-slate-400">CFOP: {item.cfop}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-muted-foreground/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                        <Globe className="w-8 h-8 text-emerald-500 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Aguardando Importação</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">Carregue o XML para mapear automaticamente a origem de cada produto conforme a legislação vigente.</p>
                </div>
            )}

            <Dialog open={isLegendOpen} onOpenChange={setIsLegendOpen}>
                <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <Landmark className="h-5 w-5" /> Tabela A - Origem da Mercadoria
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Definição dos códigos de origem utilizados no ICMS
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-3 mt-4">
                            {Object.entries(ORIGEM_LEGENDA).map(([key, label]) => (
                                <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <Badge className="h-6 w-6 p-0 shrink-0 flex items-center justify-center font-black">
                                        {key}
                                    </Badge>
                                    <span className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
