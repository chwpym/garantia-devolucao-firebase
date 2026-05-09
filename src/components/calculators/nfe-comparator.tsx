
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
         <Card className="mt-8 border-none shadow-2xl overflow-hidden rounded-3xl bg-white dark:bg-slate-950">
            <CardHeader className="bg-slate-900 text-white p-6">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                    <GitCompareArrows size={24} className="text-indigo-400" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900 border-none">
                                <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 px-6">Produto / SKU</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Fontes</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">Volume Total</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-indigo-600">Investimento</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-500 px-6">Detalhamento por Nota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((result) => (
                                <TableRow key={`${result.code}-${result.description}`} className="hover:bg-slate-50 transition-colors border-slate-100">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-1">{result.description}</span>
                                            <span className="font-mono text-[10px] font-black text-indigo-600">{result.code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-black text-[10px] rounded-lg border-none">
                                            {result.nfeCount} XMLS
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-xs text-slate-600">{formatNumber(result.totalQuantity)}</TableCell>
                                    <TableCell className="text-right font-black text-xs text-indigo-600">{formatCurrency(result.totalValue)}</TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex flex-col gap-2 py-2">
                                            {result.occurrences.map((occ, index) => (
                                                <div key={index} className="text-[9px] p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative group/item">
                                                   <div className="flex justify-between items-center mb-1">
                                                       <span className="font-black text-slate-500 uppercase tracking-tighter truncate max-w-[120px]">{occ.emitterName}</span>
                                                       <span className="text-indigo-600 font-black">NF: {occ.nfeNumber}</span>
                                                   </div>
                                                   <div className="flex justify-between items-center">
                                                        <span className="text-slate-400 font-bold">Qtde: {formatNumber(occ.quantity)}</span>
                                                        <span className="font-medium text-primary whitespace-nowrap">{formatCurrency4(occ.unitCost)}</span>
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
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Investimento Total nos Resultados</span>
                    <span className="text-2xl font-black text-emerald-400">{formatCurrency(grandTotalValue)}</span>
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
                        <GitCompareArrows className="w-6 h-6 text-indigo-600" /> Comparador Estratégico de NF-e
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Histórico de Preços e Análise de Divergências entre Notas</p>
                </div>
                <NfeUploader />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="md:col-span-1 border-none shadow-xl rounded-3xl bg-white dark:bg-slate-950 p-6 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <History size={14} /> Pesquisar Histórico
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="SKU ou Nome do Produto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10 h-11 font-bold text-sm bg-slate-50 border-slate-100 rounded-xl"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSearch} disabled={isSearching || !allNfes.length} className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl">
                                {isSearching ? "Buscando..." : "Buscar Agora"}
                            </Button>
                            {allNfes.length > 1 && (
                                <Button onClick={handleCompare} variant="outline" disabled={isComparing} className="flex-1 h-11 border-indigo-200 text-indigo-600 font-black rounded-xl">
                                    Compare Duplicados
                                </Button>
                            )}
                        </div>
                        {allNfes.length > 0 && (
                            <Button onClick={clearAll} variant="ghost" className="w-full text-rose-500 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest">
                                <Trash2 size={14} className="mr-2" /> Limpar Sessão
                            </Button>
                        )}
                    </div>
                 </Card>

                 <Card className="md:col-span-2 border-none shadow-xl rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden group">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                        <Files size={150} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-500 text-white font-black rounded-lg border-none px-3 h-8 text-sm">
                                {allNfes.length} XMLS
                            </Badge>
                            <h3 className="text-xl font-black">Fluxo de Dados Ativo</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400">Total Produtos</span>
                                <p className="text-xl font-black">{allNfes.reduce((acc, n) => acc + n.items.length, 0)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400">Investimento</span>
                                <p className="text-xl font-black text-emerald-400">{formatCurrency(allNfes.reduce((acc, n) => acc + n.totals.vNF, 0))}</p>
                            </div>
                        </div>
                    </div>
                 </Card>
            </div>

            {allNfes.length > 0 && (
                <div className="space-y-4 pt-4">
                     <Accordion type="multiple" className="w-full space-y-3">
                        {allNfes.map((nfe, index) => (
                            <AccordionItem value={nfe.header.chave || `nfe-${index}`} key={nfe.header.chave || `nfe-${index}`} className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-950 px-6 overflow-hidden">
                                <AccordionTrigger className="hover:no-underline py-5 group">
                                    <div className="flex flex-col text-left gap-1">
                                      <div className="flex items-center gap-2">
                                          <span className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">
                                              {nfe.emit.xNome}
                                          </span>
                                          <Badge variant="outline" className="text-[9px] font-black border-slate-200">NF {nfe.header.nNF}</Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                          <span className="flex items-center gap-1"><Files size={10} /> {nfe.items.length} Itens</span>
                                          <span className="flex items-center gap-1 text-emerald-600"><DollarSign size={10} /> {formatCurrency(nfe.totals.vNF)}</span>
                                      </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6">
                                    <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/30">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-slate-50">
                                                    <TableHead className="text-[9px] font-black uppercase py-3">Código</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase">Descrição</TableHead>
                                                    <TableHead className="text-right text-[9px] font-black uppercase">Qtd</TableHead>
                                                    <TableHead className="text-right text-[9px] font-black uppercase">Custo Unit.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {nfe.items.map((prod, idx) => (
                                                    <TableRow key={`${nfe.header.chave}-${idx}`} className="hover:bg-white border-slate-100">
                                                        <TableCell className="font-mono text-[10px] font-black text-indigo-600">{prod.cProd}</TableCell>
                                                        <TableCell className="text-[10px] font-bold text-slate-700 leading-tight">{prod.xProd}</TableCell>
                                                        <TableCell className="text-right font-mono text-[10px]">{formatNumber(prod.qCom)}</TableCell>
                                                        <TableCell className="text-right font-mono text-[10px] font-black text-slate-900">{formatCurrency4(prod.vUnCom)}</TableCell>
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
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6">
                        <GitCompareArrows className="w-8 h-8 text-indigo-400 opacity-50" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Comparação Inteligente</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">Importe dois ou mais arquivos XML para cruzar dados de fornecedores e auditar variações de custos unitários.</p>
                </div>
            )}
        </div>
    );
}
