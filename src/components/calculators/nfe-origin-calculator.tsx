
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
                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Globe className="w-6 h-6 text-primary" />
                        Origem da Mercadoria
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-black opacity-70">Análise de Nacionalidade e Conteúdo de Importação</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsLegendOpen(true)} className="h-9 shadow-sm border-border hover:bg-muted font-black rounded-xl">
                        <HelpCircle className="mr-2 h-4 w-4" /> Legenda de Origens
                    </Button>
                    <NfeUploader />
                </div>
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-primary text-primary-foreground shadow-lg border-none overflow-hidden relative">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-background/20 flex items-center justify-center shrink-0">
                                <Globe size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black uppercase opacity-80">Nacionais</span>
                                <p className="text-2xl font-black">{items.filter(i => ['0', '3', '4', '5', '8'].includes(i.orig)).length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-foreground text-background shadow-lg border-none overflow-hidden relative">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
                                <PackageSearch size={24} className="text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black uppercase opacity-60">Importados / Adq. Interno</span>
                                <p className="text-2xl font-black text-primary">{items.filter(i => ['1', '2', '6', '7'].includes(i.orig)).length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card text-card-foreground shadow-sm border border-border overflow-hidden relative">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <FileText size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black uppercase opacity-80">Total de Itens</span>
                                <p className="text-2xl font-black">{items.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {items.length > 0 ? (
                <div className="rounded-xl border border-border shadow-xl overflow-hidden bg-card text-foreground">
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 border-b border-border">
                                    <TableHead className="w-[120px] text-[10px] font-black uppercase text-muted-foreground opacity-70">Cód. Forn.</TableHead>
                                    <TableHead className="min-w-[250px] text-[10px] font-black uppercase text-muted-foreground opacity-70">Descrição do Produto</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-muted-foreground opacity-70">NCM</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-muted-foreground opacity-70">Origem (Tabela A)</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase text-muted-foreground opacity-70">CST/CFOP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                                        <TableCell className="font-mono text-[10px] font-black text-primary">{item.cProd}</TableCell>
                                        <TableCell className="text-xs font-black">{item.description}</TableCell>
                                        <TableCell className="text-center font-mono text-[10px] text-muted-foreground opacity-60 font-black">{item.ncm}</TableCell>
                                        <TableCell className="text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant={['0', '4', '5'].includes(item.orig) ? "secondary" : "default"} className="h-6 w-6 p-0 flex items-center justify-center font-black rounded-lg">
                                                            {item.orig}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs p-3 rounded-xl border border-border shadow-2xl bg-card text-foreground">
                                                        <p className="text-[10px] font-black uppercase border-b border-border mb-1 pb-1 opacity-70">Origem do Produto</p>
                                                        <p className="text-xs leading-tight font-black">{ORIGEM_LEGENDA[item.orig] || "Não identificada"}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-mono font-black text-foreground">{item.cst}</span>
                                                <span className="text-[9px] text-muted-foreground font-black opacity-60 uppercase">CFOP: {item.cfop}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-border text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Globe className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Aguardando Importação</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 font-medium">Carregue o XML para mapear automaticamente a origem de cada produto conforme a legislação vigente.</p>
                </div>
            )}

            <Dialog open={isLegendOpen} onOpenChange={setIsLegendOpen}>
                <DialogContent className="max-w-md rounded-2xl border border-border shadow-2xl bg-card text-foreground">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-black">
                            <Landmark className="h-5 w-5" /> Tabela A - Origem
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase opacity-70">
                            Definição dos códigos de origem utilizados no ICMS
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4 mt-4">
                        <div className="space-y-2">
                            {Object.entries(ORIGEM_LEGENDA).map(([key, label]) => (
                                <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                                    <Badge className="h-6 w-6 p-0 shrink-0 flex items-center justify-center font-black rounded-lg bg-primary text-primary-foreground">
                                        {key}
                                    </Badge>
                                    <span className="text-[11px] leading-snug font-black text-foreground opacity-80">{label}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
