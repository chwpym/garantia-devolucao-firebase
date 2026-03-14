'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Devolucao, ItemDevolucao, Product, Warranty } from '@/lib/types';
import * as db from '@/lib/db';
import { addDays, endOfMonth, parseISO, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerWithRange } from '../ui/date-range-picker';
import { Button } from '../ui/button';
import { BarChart3, Edit2, Package, TrendingDown, Undo, Wrench } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import ProductForm from '../product-form';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';


interface ProductWarrantyStats {
    codigo: string;
    descricao: string;
    marca: string;
    ocorrencias: number;
    totalQtd: number;
}

interface BrandWarrantyStats {
    marca: string;
    ocorrencias: number;
    totalQtd: number;
}

interface ProductReturnStats {
    codigo: string;
    descricao: string;
    ocorrencias: number;
    totalQtd: number;
}

interface ReportData {
    topProductsByWarranty: ProductWarrantyStats[];
    topBrandsByWarranty: BrandWarrantyStats[];
    topProductsByReturn: ProductReturnStats[];
}


const initialDateRange: DateRange = {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
};

export default function ProductReportSection() {
    const [allWarranties, setAllWarranties] = useState<Warranty[]>([]);
    const [allDevolucoes, setAllDevolucoes] = useState<(Devolucao & { itens: ItemDevolucao[] })[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [auditProducts, setAuditProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            await db.initDB();
            const [warranties, devolucoes, products] = await Promise.all([
                db.getAllWarranties(),
                db.getAllDevolucoes(),
                db.getAllProducts(),
            ]);
            setAllWarranties(warranties);
            setAllDevolucoes(devolucoes);
            setAllProducts(products);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({
                title: 'Erro ao Carregar Dados',
                description: 'Não foi possível carregar os dados para os relatórios.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);


    const generateReport = useCallback(() => {
        const { from, to } = dateRange || {};

        const filteredWarranties = allWarranties.filter(w => {
            if (!w.dataRegistro) return false;
            const regDate = parseISO(w.dataRegistro);
            if (from && regDate < from) return false;
            if (to && regDate >= addDays(to, 1)) return false;
            return true;
        });

        const filteredDevolucoes = allDevolucoes.filter(d => {
            if (!d.dataDevolucao) return false;
            const devDate = parseISO(d.dataDevolucao);
            if (from && devDate < from) return false;
            if (to && devDate >= addDays(to, 1)) return false;
            return true;
        });

        if (filteredWarranties.length === 0 && filteredDevolucoes.length === 0) {
            setReportData(null);
            toast({
                title: 'Nenhum dado no período',
                description: 'Não há garantias ou devoluções no período selecionado.',
            });
            return;
        }

        // 1. Top products by warranty
        const warrantyProductStats: Record<string, { totalQtd: number, ocorrencias: number }> = {};
        filteredWarranties.forEach(w => {
            if (w.codigo) {
                if (!warrantyProductStats[w.codigo]) {
                    warrantyProductStats[w.codigo] = { totalQtd: 0, ocorrencias: 0 };
                }
                warrantyProductStats[w.codigo].totalQtd += w.quantidade || 1;
                warrantyProductStats[w.codigo].ocorrencias++;
            }
        });

        const topProductsByWarranty = Object.entries(warrantyProductStats).map(([codigo, stats]) => {
            const productInfo = allProducts.find(p => p.codigo === codigo);
            return {
                codigo,
                descricao: productInfo?.descricao || 'Produto não cadastrado',
                marca: productInfo?.marca || 'N/A',
                ...stats,
            };
        }).sort((a, b) => b.ocorrencias - a.ocorrencias);


        // 2. Top brands by warranty
        const brandStats: Record<string, { totalQtd: number, ocorrencias: number }> = {};
        topProductsByWarranty.forEach(p => {
            if (!brandStats[p.marca]) {
                brandStats[p.marca] = { totalQtd: 0, ocorrencias: 0 };
            }
            brandStats[p.marca].totalQtd += p.totalQtd;
            brandStats[p.marca].ocorrencias += p.ocorrencias;
        });

        const topBrandsByWarranty = Object.entries(brandStats).map(([marca, stats]) => ({
            marca,
            ...stats
        })).sort((a,b) => b.ocorrencias - a.ocorrencias);

        // 3. Top products by return
        const returnProductStats: Record<string, { totalQtd: number, ocorrencias: number }> = {};
        const flatReturns = filteredDevolucoes.flatMap(d => d.itens.map(i => ({...i, dev: d})));
        
        flatReturns.forEach(item => {
            if (item.codigoPeca) {
                if (!returnProductStats[item.codigoPeca]) {
                    returnProductStats[item.codigoPeca] = { totalQtd: 0, ocorrencias: 0 };
                }
                returnProductStats[item.codigoPeca].totalQtd += item.quantidade;
                returnProductStats[item.codigoPeca].ocorrencias++;
            }
        });
        
         const topProductsByReturn = Object.entries(returnProductStats).map(([codigo, stats]) => {
            const productInfo = allProducts.find(p => p.codigo === codigo);
            return {
                codigo,
                descricao: productInfo?.descricao || 'Produto não cadastrado',
                ...stats,
            };
        }).sort((a, b) => b.ocorrencias - a.ocorrencias);

        setReportData({ topProductsByWarranty, topBrandsByWarranty, topProductsByReturn });

    }, [allDevolucoes, allProducts, allWarranties, dateRange, toast]);

    const handleBrandClick = (marca: string) => {
        // 1. Get products already in the database for this brand
        const registeredProducts = allProducts.filter(p => {
            if (marca === 'N/A') return !p.marca || p.marca === 'N/A';
            return p.marca === marca;
        });

        // 2. Identify "Ghost Products" (not in database but present in warranties/returns)
        const ghostProducts: Product[] = [];
        
        if (marca === 'N/A') {
            const allCodesInRecords = new Set<string>();
            const codeToDesc = new Map<string, string>();

            allWarranties.forEach(w => {
                if (w.codigo) {
                    allCodesInRecords.add(w.codigo);
                    if (w.descricao && !codeToDesc.has(w.codigo)) codeToDesc.set(w.codigo, w.descricao);
                }
            });

            allDevolucoes.forEach(d => {
                d.itens.forEach(i => {
                    if (i.codigoPeca) {
                        allCodesInRecords.add(i.codigoPeca);
                        if (i.descricaoPeca && !codeToDesc.has(i.codigoPeca)) codeToDesc.set(i.codigoPeca, i.descricaoPeca);
                    }
                });
            });

            allCodesInRecords.forEach(code => {
                const exists = allProducts.some(p => p.codigo === code);
                if (!exists) {
                    ghostProducts.push({
                        id: -1, // Mark as ghost (ID doesn't exist yet)
                        codigo: code,
                        descricao: codeToDesc.get(code) || 'Produto não cadastrado',
                        marca: 'N/A',
                        referencia: ''
                    });
                }
            });
        }

        setAuditProducts([...registeredProducts, ...ghostProducts]);
        setSelectedBrand(marca);
        setIsAuditModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsEditModalOpen(true);
    };

    const handleProductSave = async (updatedProduct: Product) => {
        // If it was a ghost product, it might now have a real ID after saving (handled by db.updateProduct or similar if it creates)
        // Since we are updating local state, let's just reload the whole data to be sure
        await loadData();
        
        setIsEditModalOpen(false);
        setEditingProduct(null);
        
        // Regenerate report
        setTimeout(generateReport, 100);
        
        toast({
            title: "Sucesso",
            description: "Produto atualizado com sucesso.",
        });
    };

    return (
        <>
            <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios de Produtos</h1>
                <p className="text-lg text-muted-foreground">
                    Análises de desempenho de produtos com base em garantias e devoluções.
                </p>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Filtros do Relatório</CardTitle>
                    <CardDescription>Selecione o período para gerar as análises.</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col md:flex-row gap-4 items-center'>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    <Button onClick={generateReport} disabled={isLoading}>
                        <BarChart3 className='mr-2 h-4 w-4' />
                        Gerar Análises
                    </Button>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full md:col-span-2" />
                </div>
            )}
            
            {reportData && (
                <div className='space-y-6 animate-in fade-in-50'>
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2 text-primary'><Wrench className='h-5 w-5' /> Ranking de Garantias por Produto</CardTitle>
                                <CardDescription>Produtos com maior número de ocorrências de garantia no período.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className='text-right'>Ocorrências</TableHead><TableHead className='text-right'>Qtd. Total</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.topProductsByWarranty.slice(0, 10).map(p => (
                                            <TableRow key={p.codigo}>
                                                <TableCell>
                                                    <div className='font-medium'>{p.codigo}</div>
                                                    <div className='text-xs text-muted-foreground'>{p.descricao}</div>
                                                </TableCell>
                                                <TableCell className='text-right font-bold'>{p.ocorrencias}</TableCell>
                                                <TableCell className='text-right'>{p.totalQtd}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2 text-amber-600'><TrendingDown className='h-5 w-5' /> Ranking de Garantias por Marca</CardTitle>
                                <CardDescription>Marcas com maior número de ocorrências de garantia no período.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Marca</TableHead><TableHead className='text-right'>Ocorrências</TableHead><TableHead className='text-right'>Qtd. Total</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.topBrandsByWarranty.slice(0, 10).map(b => (
                                            <TableRow 
                                                key={b.marca} 
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => handleBrandClick(b.marca)}
                                            >
                                                <TableCell className='font-medium'>
                                                    {b.marca}
                                                    {b.marca === 'N/A' && (
                                                        <span className="ml-2 text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full uppercase">Corrigir</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className='text-right font-bold'>{b.ocorrencias}</TableCell>
                                                <TableCell className='text-right'>{b.totalQtd}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2 text-accent-blue'><Undo className='h-5 w-5' /> Ranking de Devoluções por Produto</CardTitle>
                                <CardDescription>Produtos com maior número de devoluções no período.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className='text-right'>Ocorrências</TableHead><TableHead className='text-right'>Qtd. Total</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.topProductsByReturn.slice(0, 10).map(p => (
                                            <TableRow key={p.codigo}>
                                                <TableCell>
                                                    <div className='font-medium'>{p.codigo}</div>
                                                    <div className='text-xs text-muted-foreground'>{p.descricao}</div>
                                                </TableCell>
                                                <TableCell className='text-right font-bold'>{p.ocorrencias}</TableCell>
                                                <TableCell className='text-right'>{p.totalQtd}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                     </div>
                </div>
            )}
            
            {!isLoading && !reportData && (allWarranties.length > 0 || allDevolucoes.length > 0) && (
                 <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">Gere uma Análise</h2>
                    <p className="text-muted-foreground mt-2">
                    Clique em &quot;Gerar Análises&quot; para visualizar os relatórios do período selecionado.
                    </p>
                </div>
            )}

            {!isLoading && allWarranties.length === 0 && allDevolucoes.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">Nenhum Registro Encontrado</h2>
                    <p className="text-muted-foreground mt-2">
                    Cadastre suas garantias e devoluções para poder visualizar os relatórios de produtos.
                    </p>
                </div>
            )}


        </div>

        {/* Modal de Auditoria de Marcas */}
        <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Produtos da Marca: {selectedBrand}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedBrand === 'N/A' 
                            ? "Estes produtos não possuem marca cadastrada. Clique em editar para preencher." 
                            : `Lista de produtos catalogados sob a marca ${selectedBrand}.`}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow mt-4 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Marca Atual</TableHead>
                                <TableHead className="w-[100px]">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-mono text-xs">{product.codigo}</TableCell>
                                    <TableCell className="text-xs">{product.descricao}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            !product.marca || product.marca === 'N/A' 
                                                ? "bg-destructive/10 text-destructive font-bold" 
                                                : "bg-secondary text-secondary-foreground"
                                        )}>
                                            {product.marca || 'N/A'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-primary"
                                            onClick={() => handleEditProduct(product)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {auditProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhum produto cadastrado para esta marca.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                
                <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => setIsAuditModalOpen(false)}>Fechar</Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Modal de Edição de Produto (Drill-down) */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Editar Produto</DialogTitle>
                    <DialogDescription>Atualize os dados e a marca do produto para corrigir o relatório.</DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    {editingProduct && (
                        <ProductForm 
                            editingProduct={editingProduct} 
                            onSave={handleProductSave}
                            onClear={() => setIsEditModalOpen(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}

    