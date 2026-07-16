
'use client';

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GitCompareArrows, Search, Info, History, Files, ArrowRightLeft, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, formatCurrency4 } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNfeStore } from "@/store/use-nfe-store";
import { NfeUploader } from "@/components/nfe/NfeUploader";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComparisonResult {
    code: string;
    description: string;
    totalQuantity: number;
    totalValue: number;
    nfeCount: number;
    occurrences: Array<{
        nfeId: string;
        nfeNumber: string;
        emitterName: string;
        quantity: number;
        unitCost: number;
    }>;
}

export default function NfeComparator() {
    const { allNfes, clearAll } = useNfeStore();
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult[]>([]);
    const [searchResult, setSearchResult] = useState<ComparisonResult[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const getAllProducts = useCallback(() => {
       return allNfes.flatMap(nfe => 
            nfe.items.map(item => ({
                code: item.cProd,
                description: item.xProd,
                quantity: item.qCom,
                unitCost: item.vUnCom,
                nfeId: nfe.header.chave,
                nfeNumber: nfe.header.nNF || 'N/A',
                emitterName: nfe.emit.xNome || 'N/A'
            }))
        );
    }, [allNfes]);

    const handleCompare = useCallback(() => {
        if (allNfes.length < 2) {
            toast({
                variant: "destructive",
                title: "Poucos arquivos",
                description: "É necessário carregar pelo menos 2 NF-es para comparar.",
            });
            return;
        }

        setIsComparing(true);
        setComparisonResult([]);
        setSearchResult([]);

        const allProducts = getAllProducts();

        const groupedByCode = allProducts.reduce((acc, p) => {
            if (!acc[p.code]) {
                acc[p.code] = [];
            }
            acc[p.code].push(p);
            return acc;
        }, {} as Record<string, typeof allProducts>);

        const duplicates = Object.values(groupedByCode)
            .filter(group => group.length > 1)
            .map(group => {
                const first = group[0];
                return {
                    code: first.code,
                    description: first.description,
                    totalQuantity: group.reduce((sum, item) => sum + item.quantity, 0),
                    totalValue: group.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
                    nfeCount: new Set(group.map(item => item.nfeId)).size,
                    occurrences: group.map(item => ({
                        nfeId: item.nfeId || 'N/A',
                        nfeNumber: item.nfeNumber,
                        emitterName: item.emitterName,
                        quantity: item.quantity,
                        unitCost: item.unitCost
                    }))
                };
            }).filter(item => item.nfeCount > 1);
        
        duplicates.sort((a,b) => b.nfeCount - a.nfeCount || a.description.localeCompare(b.description));

        setComparisonResult(duplicates);

        toast({
            title: "Comparação Concluída",
            description: `${duplicates.length} produto(s) encontrado(s) em mais de uma NF-e.`
        });

        setIsComparing(false);

    }, [allNfes, toast, getAllProducts]);

    const handleSearch = useCallback(() => {
        if (allNfes.length === 0) {
            toast({ variant: "destructive", title: "Nenhuma NF-e carregada" });
            return;
        }
        if (!searchQuery.trim()) {
            toast({ variant: "destructive", title: "Termo de busca vazio" });
            return;
        }

        setIsSearching(true);
        setSearchResult([]);
        setComparisonResult([]);

        const allProducts = getAllProducts();
        const searchTerms = searchQuery.split(',').map(term => term.trim().toLowerCase()).filter(Boolean);

        const foundProducts = allProducts.filter(p => {
            const productCode = p.code.toLowerCase();
            const productDesc = p.description.toLowerCase();
            return searchTerms.some(term => productCode.includes(term) || productDesc.includes(term));
        });

        const groupedByCode = foundProducts.reduce((acc, p) => {
            const key = `${p.code}-${p.description}`;
            if (!acc[key]) {
                acc[key] = {
                    code: p.code,
                    description: p.description,
                    occurrences: []
                };
            }
            acc[key].occurrences.push({
                nfeId: p.nfeId || 'N/A',
                nfeNumber: p.nfeNumber,
                emitterName: p.emitterName,
                quantity: p.quantity,
                unitCost: p.unitCost
            });
            return acc;
        }, {} as Record<string, { code: string; description: string; occurrences: ComparisonResult['occurrences'] }>);

        const results: ComparisonResult[] = Object.values(groupedByCode).map(group => ({
            ...group,
            totalQuantity: group.occurrences.reduce((sum, item) => sum + item.quantity, 0),
            totalValue: group.occurrences.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
            nfeCount: new Set(group.occurrences.map(item => item.nfeId)).size,
        }));
        
        results.sort((a, b) => a.description.localeCompare(b.description));

        setSearchResult(results);

        toast({
            title: "Busca Concluída",
            description: `${results.length} resultado(s) encontrado(s).`
        });

        setIsSearching(false);
    }, [allNfes, searchQuery, toast, getAllProducts]);

    const renderResultTable = (results: ComparisonResult[], title: string) => {
        const grandTotalValue = results.reduce((sum, item) => sum + item.totalValue, 0);

        return (
         <Card className="mt-8 border border-border shadow-2xl overflow-hidden rounded-3xl bg-card">
            <CardHeader className="bg-foreground text-background p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                    <GitCompareArrows size={24} className="text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted border-none">
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-6">Produto / SKU</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-muted-foreground">Fontes</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground">Volume Total</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-primary">Investimento</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-6">Detalhamento por Nota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {results.map((result) => (
                                <TableRow key={`${result.code}-${result.description}`} className="hover:bg-accent/5 transition-colors border-border">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-foreground leading-tight mb-1">{result.description}</span>
                                            <span className="font-mono text-[10px] font-black text-primary">{result.code}</span>
                                        </div>
                                    </TableCell>
                                     <TableCell className="text-center">
                                        <Badge variant="secondary" className="bg-accent text-accent-foreground font-black text-[10px] rounded-lg border-none">
                                            {result.nfeCount} XMLS
                                        </Badge>
                                    </TableCell>
                                     <TableCell className="text-right font-black text-xs text-muted-foreground">{formatNumber(result.totalQuantity)}</TableCell>
                                    <TableCell className="text-right font-black text-xs text-primary">{formatCurrency(result.totalValue)}</TableCell>
                                     <TableCell className="px-6">
                                        <div className="flex flex-col gap-2 py-2">
                                            {result.occurrences.map((occ, index) => (
                                                <div key={index} className="text-[9px] p-3 rounded-xl bg-accent/20 border border-border relative group/item">
                                                   <div className="flex justify-between items-center mb-1">
                                                       <span className="font-black text-muted-foreground uppercase tracking-tighter truncate max-w-[120px]">{occ.emitterName}</span>
                                                       <span className="text-primary font-black">NF: {occ.nfeNumber}</span>
                                                   </div>
                                                   <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground/70 font-bold">Qtde: {formatNumber(occ.quantity)}</span>
                                                        <span className="font-medium text-foreground whitespace-nowrap">{formatCurrency4(occ.unitCost)}</span>
                                                   </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="bg-foreground text-background p-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Investimento Total nos Resultados</span>
                    <span className="text-2xl font-black text-accent-green">{formatCurrency(grandTotalValue)}</span>
                </div>
            </CardContent>
        </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <GitCompareArrows className="w-6 h-6 text-primary" /> Comparador Estratégico de NF-e
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase font-black tracking-wider opacity-70">Histórico de Preços e Análise de Divergências entre Notas</p>
                </div>
                <NfeUploader />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-1 border border-border shadow-xl rounded-3xl bg-card p-6 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                            <History size={14} /> Pesquisar Histórico
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="SKU ou Nome do Produto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10 h-11 font-black text-sm bg-background border-border focus:border-primary rounded-xl transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSearch} disabled={isSearching || !allNfes.length} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl">
                                {isSearching ? "Buscando..." : "Buscar Agora"}
                            </Button>
                            {allNfes.length > 1 && (
                                <Button onClick={handleCompare} variant="outline" disabled={isComparing} className="flex-1 h-11 border-primary/20 text-primary font-black rounded-xl">
                                    Comparar
                                </Button>
                            )}
                        </div>
                        {allNfes.length > 0 && (
                            <Button onClick={clearAll} variant="ghost" className="w-full text-destructive hover:bg-destructive/10 font-black text-[10px] uppercase tracking-widest rounded-xl">
                                <Trash2 size={14} className="mr-2" /> Limpar Tudo
                            </Button>
                        )}
                    </div>
                 </Card>
                   <Card className="md:col-span-2 border border-border shadow-xl rounded-3xl bg-foreground text-background p-8 relative overflow-hidden group">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                        <Files size={150} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-primary text-primary-foreground font-black rounded-lg border-none px-3 h-8 text-sm shadow-md">
                                {allNfes.length} XMLS
                            </Badge>
                            <h3 className="text-xl font-black tracking-tight">Fluxo de Dados Ativo</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase opacity-60">Total Produtos</span>
                                <p className="text-xl font-black">{allNfes.reduce((acc, n) => acc + n.items.length, 0)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase opacity-60">Investimento</span>
                                <p className="text-xl font-black text-accent-green">{formatCurrency(allNfes.reduce((acc, n) => acc + n.totals.vNF, 0))}</p>
                            </div>
                        </div>
                    </div>
                 </Card>
            </div>

            {allNfes.length > 0 && (
                <div className="space-y-4 pt-4">
                     <Accordion type="multiple" className="w-full space-y-3">
                        {allNfes.map((nfe, index) => (
                            <AccordionItem value={nfe.header.chave || `nfe-${index}`} key={nfe.header.chave || `nfe-${index}`} className="border border-border shadow-sm rounded-2xl bg-card px-6 overflow-hidden">
                                <AccordionTrigger className="hover:no-underline py-5 group transition-all">
                                    <div className="flex flex-col text-left gap-1">
                                      <div className="flex items-center gap-2">
                                          <span className="font-black text-foreground uppercase text-[10px] tracking-widest opacity-80">
                                              {nfe.emit.xNome}
                                          </span>
                                          <Badge variant="outline" className="text-[9px] font-black border-border">NF {nfe.header.nNF}</Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                                          <span className="flex items-center gap-1"><Files size={10} /> {nfe.items.length} Itens</span>
                                          <span className="flex items-center gap-1 text-accent-green"><DollarSign size={10} /> {formatCurrency(nfe.totals.vNF)}</span>
                                      </div>
                                    </div>
                                </AccordionTrigger>
                                 <AccordionContent className="pb-6">
                                    <div className="w-full overflow-hidden rounded-2xl border border-border bg-accent/10">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-muted/50">
                                                    <TableHead className="text-[9px] font-black uppercase py-3 text-muted-foreground">Código</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Descrição</TableHead>
                                                    <TableHead className="text-right text-[9px] font-black uppercase text-muted-foreground">Qtd</TableHead>
                                                    <TableHead className="text-right text-[9px] font-black uppercase text-muted-foreground">Custo Unit.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                             <TableBody>
                                                {nfe.items.map((prod, idx) => (
                                                    <TableRow key={`${nfe.header.chave}-${idx}`} className="hover:bg-background/80 border-border">
                                                        <TableCell className="font-mono text-[10px] font-black text-primary">{prod.cProd}</TableCell>
                                                        <TableCell className="text-[10px] font-bold text-foreground leading-tight">{prod.xProd}</TableCell>
                                                        <TableCell className="text-right font-mono text-[10px]">{formatNumber(prod.qCom)}</TableCell>
                                                        <TableCell className="text-right font-mono text-[10px] font-black text-foreground">{formatCurrency4(prod.vUnCom)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            )}

            {comparisonResult.length > 0 && renderResultTable(comparisonResult, "Divergências de Preços Detectadas")}
            {searchResult.length > 0 && renderResultTable(searchResult, "Histórico de Aquisições")}

            {!allNfes.length && (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-[2.5rem] bg-muted/20 border-muted-foreground/10 text-center">
                     <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                        <GitCompareArrows className="w-8 h-8 text-primary opacity-50" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Comparação Inteligente</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 font-medium">Importe dois ou mais arquivos XML para cruzar dados de fornecedores e auditar variações de custos unitários.</p>
                </div>
            )}
        </div>
    );
}
