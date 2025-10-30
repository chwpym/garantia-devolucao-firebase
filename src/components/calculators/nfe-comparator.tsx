
"use client";

import { useState, useRef, useCallback, ChangeEvent, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, GitCompareArrows, Search, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "../ui/label";
import { useNfeParser, type NfeData, type NfeProductDetail } from "@/hooks/use-nfe-parser";
import { cn } from "@/lib/utils";

interface Product {
    code: string;
    description: string;
    quantity: number;
    unitCost: number;
}

interface LoadedNfe {
    id: string; // NFe access key
    name: string; // Original filename
    nfeNumber: string;
    emitterName: string;
    products: Product[];
}

interface Occurrence {
    nfeId: string;
    nfeNumber: string;
    emitterName: string;
    quantity: number;
    unitCost: number;
    isCheapest: boolean;
}

interface ComparisonResult {
    code: string;
    description: string;
    totalQuantity: number;
    totalValue: number;
    nfeCount: number;
    occurrences: Occurrence[];
}

// Componente interno para exibir a tabela de resultados e corrigir o erro de hook
const ResultTable = ({ results, title, allLoadedNfes }: { results: ComparisonResult[], title: string, allLoadedNfes: LoadedNfe[] }) => {
    const totalsByNfe = useMemo(() => {
        const totals: Record<string, { total: number, emitter: string }> = {};
        results.forEach(product => {
            product.occurrences.forEach(occ => {
                if (!totals[occ.nfeNumber]) {
                    totals[occ.nfeNumber] = { total: 0, emitter: occ.emitterName };
                }
                totals[occ.nfeNumber].total += occ.quantity * occ.unitCost;
            });
        });
        return Object.entries(totals).sort((a,b) => a[1].emitter.localeCompare(b[1].emitter));
    }, [results]);

    const grandTotals = useMemo(() => {
        return results.reduce((acc, product) => {
            acc.quantity += product.totalQuantity;
            acc.value += product.totalValue;
            return acc;
        }, { quantity: 0, value: 0 });
    }, [results]);
    
    const getNfeById = (nfeId: string) => allLoadedNfes.find(nfe => nfe.id === nfeId);

    return (
     <Card className="mt-4">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-center">Encontrado em</TableHead>
                            <TableHead className="text-right">Qtde Total</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="min-w-[400px]">Ocorrências nas NF-es</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.map((result) => {
                            const cheapestCost = Math.min(...result.occurrences.map(o => o.unitCost));
                            return (
                                <TableRow key={`${result.code}-${result.description}`}>
                                    <TableCell>
                                        <div className="font-medium">{result.description}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{result.code}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{result.nfeCount} NF-es</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{formatNumber(result.totalQuantity)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(result.totalValue)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {result.occurrences.map((occ, index) => {
                                                const variation = cheapestCost > 0 ? ((occ.unitCost / cheapestCost) - 1) * 100 : 0;
                                                const nfeContext = getNfeById(occ.nfeId);
                                                const otherProducts = nfeContext?.products
                                                    .filter(p => p.code !== result.code)
                                                    .slice(0, 3);
                                                
                                                return (
                                                    <div 
                                                        key={index} 
                                                        className={cn(
                                                            "text-xs p-2 rounded-md bg-muted",
                                                            occ.isCheapest && "bg-green-100 dark:bg-green-900/50"
                                                        )}
                                                        title={`${occ.emitterName} - NF-e: ${occ.nfeNumber}`}
                                                    >
                                                    <p className="font-semibold">{occ.emitterName}</p>
                                                    <div className="flex flex-wrap justify-between items-center mt-1 gap-x-4 gap-y-1">
                                                            <span>NF-e: {occ.nfeNumber}</span>
                                                            <span>Qtde: {formatNumber(occ.quantity)}</span>
                                                            <span className={cn(occ.isCheapest && "font-bold text-green-700 dark:text-green-400")}>
                                                                Custo: {formatCurrency(occ.unitCost)}
                                                                {!occ.isCheapest && variation > 0.01 && (
                                                                    <Badge variant="destructive" className="ml-2">+{formatNumber(variation)}%</Badge>
                                                                )}
                                                            </span>
                                                            <span className="font-semibold">Subtotal: {formatCurrency(occ.quantity * occ.unitCost)}</span>
                                                             {otherProducts && otherProducts.length > 0 && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Info className="h-3 w-3 cursor-pointer text-muted-foreground" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs">
                                                                            <p className="font-bold mb-2">Outros itens nesta NF-e:</p>
                                                                            <ul className="list-disc pl-4 space-y-1 text-xs">
                                                                                {otherProducts.map(p => <li key={p.code}>{p.description}</li>)}
                                                                                {nfeContext && nfeContext.products.length > 4 && <li>...e mais.</li>}
                                                                            </ul>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                    </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                     <TableFooter>
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={4} className="text-right font-semibold text-sm">Totais por NF-e:</TableCell>
                            <TableCell>
                                {totalsByNfe.length > 0 ? (
                                    <div className="flex flex-col gap-1 text-xs">
                                        {totalsByNfe.map(([nfeNumber, data]) => (
                                            <div key={nfeNumber} className="flex justify-between p-1 rounded bg-background">
                                                <span className="text-muted-foreground">{data.emitter} (NF-e: {nfeNumber}):</span>
                                                <span className="font-bold text-primary">{formatCurrency(data.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span>-</span>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow className="font-bold bg-muted text-base">
                            <TableCell colSpan={2} className="text-right">Totais Gerais:</TableCell>
                            <TableCell className="text-right">{formatNumber(grandTotals.quantity)}</TableCell>
                            <TableCell className="text-right text-primary">{formatCurrency(grandTotals.value)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </CardContent>
    </Card>
    );
};


export default function NfeComparator() {
    const [loadedNfes, setLoadedNfes] = useState<LoadedNfe[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult[]>([]);
    const [searchResult, setSearchResult] = useState<ComparisonResult[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentFileRef = useRef<File | null>(null);

    const onNfeProcessed = (data: NfeData | null) => {
        if (!data || !currentFileRef.current) {
            if(currentFileRef.current) {
                toast({
                    variant: "destructive",
                    title: "Erro de Importação",
                    description: `Falha ao processar ${currentFileRef.current.name}.`,
                });
            }
            return;
        }

        const { infNFe, det: dets } = data;
        const nfeId = infNFe['@_Id'];
        
        if (loadedNfes.some(nfe => nfe.id === nfeId)) {
            toast({
                variant: 'default',
                title: "Aviso",
                description: `O arquivo ${currentFileRef.current.name} já foi carregado e será ignorado.`,
            });
            return;
        }

        const products: Product[] = dets.map((det: NfeProductDetail) => {
            const prod = det.prod;
            return {
                code: String(prod.cProd),
                description: prod.xProd || "Sem descrição",
                quantity: parseFloat(prod.qCom) || 0,
                unitCost: parseFloat(prod.vUnCom) || 0,
            };
        });
        
        const newNfe: LoadedNfe = { 
            id: nfeId,
            name: currentFileRef.current.name, 
            nfeNumber: infNFe.ide?.nNF || 'N/A',
            emitterName: infNFe.emit?.xNome || 'N/A',
            products 
        };
        
        setLoadedNfes(prev => [...prev, newNfe].sort((a, b) => a.emitterName.localeCompare(b.emitterName)));
        toast({
            title: "Sucesso!",
            description: `NF-e ${newNfe.nfeNumber} do arquivo ${newNfe.name} carregada.`,
        });
    };
    
    const { handleFileChange: originalHandleFileChange, clearNfeData: originalClearNfeData } = useNfeParser({ onNfeProcessed });
    
    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            currentFileRef.current = file;
            // Create a new event object for each file to pass to the hook
            const singleFileEvent = {
                target: { files: [file] as unknown as FileList },
            } as ChangeEvent<HTMLInputElement>;
            originalHandleFileChange(singleFileEvent);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const getAllProducts = useCallback(() => {
       return loadedNfes.flatMap(nfe => 
            nfe.products.map(p => ({
                ...p,
                nfeId: nfe.id,
                nfeNumber: nfe.nfeNumber,
                emitterName: nfe.emitterName
            }))
        );
    }, [loadedNfes]);
    
    const processResults = useCallback((groupedProducts: Record<string, ReturnType<typeof getAllProducts>>): ComparisonResult[] => {
        return Object.values(groupedProducts).map(group => {
            const first = group[0];
            const minCost = Math.min(...group.map(item => item.unitCost));

            return {
                code: first.code,
                description: first.description,
                totalQuantity: group.reduce((sum, item) => sum + item.quantity, 0),
                totalValue: group.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
                nfeCount: new Set(group.map(item => item.nfeId)).size,
                occurrences: group.map(item => ({
                    nfeId: item.nfeId,
                    nfeNumber: item.nfeNumber,
                    emitterName: item.emitterName,
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                    isCheapest: item.unitCost === minCost,
                }))
            };
        });
    }, [getAllProducts]);

    const handleCompare = useCallback(() => {
        if (loadedNfes.length < 2) {
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
            if (!acc[p.code]) acc[p.code] = [];
            acc[p.code].push(p);
            return acc;
        }, {} as Record<string, typeof allProducts>);

        const processed = processResults(groupedByCode);
        const duplicates = processed.filter(item => item.nfeCount > 1);
        duplicates.sort((a,b) => b.nfeCount - a.nfeCount || a.description.localeCompare(b.description));

        setComparisonResult(duplicates);

        toast({
            title: "Comparação Concluída",
            description: `${duplicates.length} produto(s) encontrado(s) em mais de uma NF-e.`
        });

        setIsComparing(false);

    }, [loadedNfes, toast, getAllProducts, processResults]);


     const handleSearch = useCallback(() => {
        if (loadedNfes.length === 0) {
            toast({ variant: "destructive", title: "Nenhuma NF-e carregada" });
            return;
        }
        if (!searchQuery.trim()) {
            toast({ variant: "destructive", title: "Termo de busca vazio" });
            return;
        }

        setIsSearching(true);
        setSearchResult([]);
        setComparisonResult([]); // Limpa a comparação ao buscar

        const allProducts = getAllProducts();
        const searchTerms = searchQuery.split(',').map(term => term.trim().toLowerCase()).filter(Boolean);

        const foundProducts = allProducts.filter(p => {
            const productCode = p.code.toLowerCase();
            const productDesc = p.description.toLowerCase();
            return searchTerms.some(term => productCode.includes(term) || productDesc.includes(term));
        });

        const groupedByCode = foundProducts.reduce((acc, p) => {
            const key = `${p.code}-${p.description}`;
             if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {} as Record<string, typeof allProducts>);
        
        const results = processResults(groupedByCode);
        results.sort((a, b) => a.description.localeCompare(b.description));
        setSearchResult(results);

        toast({
            title: "Busca Concluída",
            description: `${results.length} resultado(s) encontrado(s).`
        });

        setIsSearching(false);
    }, [loadedNfes, searchQuery, toast, getAllProducts, processResults]);


    const clearData = useCallback(() => {
        setLoadedNfes([]);
        setComparisonResult([]);
        setSearchResult([]);
        setSearchQuery("");
        originalClearNfeData();
        toast({ title: "Dados limpos", description: "A área de comparação está pronta para novos arquivos." });
    }, [originalClearNfeData, toast]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Controles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isComparing || isSearching}>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar Arquivos XML
                        </Button>
                        {loadedNfes.length > 1 && (
                            <Button onClick={handleCompare} variant="accent-blue" disabled={isComparing || isSearching}>
                                <GitCompareArrows className="mr-2 h-4 w-4" />
                                {isComparing ? 'Comparando...' : 'Comparar Duplicados'}
                            </Button>
                        )}
                        {loadedNfes.length > 0 && (
                            <Button onClick={clearData} variant="destructive" disabled={isComparing || isSearching}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Limpar Dados
                            </Button>
                        )}
                        <Input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFilesChange}
                            className="hidden" 
                            accept=".xml"
                            multiple
                            disabled={isComparing || isSearching}
                        />
                    </div>
                     {loadedNfes.length > 0 && (
                        <div className="pt-4 border-t">
                            <Label htmlFor="search-input">Buscar produto por código ou descrição (use vírgula para múltiplos termos)</Label>
                            <div className="flex gap-2 mt-2">
                                <Input 
                                    id="search-input"
                                    placeholder="Ex: 12345, correia"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    disabled={isSearching}
                                />
                                <Button onClick={handleSearch} disabled={isSearching}>
                                    <Search className="mr-2 h-4 w-4" />
                                    {isSearching ? "Buscando..." : "Buscar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>


            {loadedNfes.length > 0 && (
                <div className="space-y-2 pt-4">
                    <h3 className="text-lg font-medium">NF-es Carregadas ({loadedNfes.length}):</h3>
                     <Accordion type="multiple" className="w-full">
                        {loadedNfes.map((nfe) => (
                            <AccordionItem value={nfe.id} key={nfe.id}>
                                <AccordionTrigger>
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium">{nfe.emitterName}</span>
                                      <span className="text-sm text-muted-foreground">NF-e: {nfe.nfeNumber} ({nfe.products.length} produtos)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="w-full overflow-x-auto p-2 bg-background rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Código</TableHead>
                                                    <TableHead>Descrição</TableHead>
                                                    <TableHead className="text-right">Quantidade</TableHead>
                                                    <TableHead className="text-right">Custo Unitário</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {nfe.products.map((prod) => (
                                                    <TableRow key={`${nfe.id}-${prod.code}`}>
                                                        <TableCell className="font-mono text-xs">{prod.code}</TableCell>
                                                        <TableCell>{prod.description}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(prod.quantity)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(prod.unitCost)}</TableCell>
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

            {comparisonResult.length > 0 && <ResultTable results={comparisonResult} title="Resultados da Comparação de Duplicados" allLoadedNfes={loadedNfes} />}
            {searchResult.length > 0 && <ResultTable results={searchResult} title="Resultados da Busca" allLoadedNfes={loadedNfes} />}

        </div>
    );
}
