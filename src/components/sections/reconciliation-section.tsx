
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { CheckCircle2, AlertCircle, Loader2, Save, Search, User, Building, Archive } from 'lucide-react';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import type { Product, Supplier, Person } from '@/lib/types';

type Category = 'products' | 'suppliers' | 'persons';

export default function ReconciliationSection() {
    const [activeTab, setActiveTab] = useState<Category>('products');
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingOnly, setPendingOnly] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);

    const { toast } = useToast();
    const { products, suppliers, persons, reloadData } = useAppStore(useShallow((state) => ({
        products: state.products,
        suppliers: state.suppliers,
        persons: state.persons,
        reloadData: state.reloadData,
    })));

    // Filter logic based on active tab and search/pending status
    const filteredItems = useMemo(() => {
        let items: any[] = [];
        if (activeTab === 'products') items = products;
        else if (activeTab === 'suppliers') items = suppliers;
        else if (activeTab === 'persons') items = persons;

        return items.filter(item => {
            const matchesSearch = (item.descricao || item.nome || item.nomeFantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.codigo || item.cnpj || item.cpfCnpj || '').toLowerCase().includes(searchTerm.toLowerCase());

            const isPending = !item.codigoExterno;

            return matchesSearch && (pendingOnly ? isPending : true);
        });
    }, [activeTab, products, suppliers, persons, searchTerm, pendingOnly]);

    const handleUpdate = async (item: any, value: string) => {
        if (item.codigoExterno === value) return;

        setSavingId(item.id);
        try {
            const updatedItem = { ...item, codigoExterno: value };

            if (activeTab === 'products') await db.updateProduct(updatedItem);
            else if (activeTab === 'suppliers') await db.updateSupplier(updatedItem);
            else if (activeTab === 'persons') await db.updatePerson(updatedItem);

            // Update local store without full reload for speed
            await reloadData(activeTab);

            toast({
                title: 'Atualizado',
                description: 'Código externo salvo com sucesso.',
            });
        } catch (error) {
            console.error('Failed to update external code:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar o código externo.',
                variant: 'destructive',
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Conciliação de Códigos</h1>
                    <p className="text-muted-foreground">Vincule identificadores de sistemas externos aos seus registros locais.</p>
                </div>
            </div>

            <Tabs defaultValue="products" onValueChange={(v) => setActiveTab(v as Category)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                    <TabsTrigger value="products" className="gap-2">
                        <Archive className="h-4 w-4" />
                        Produtos
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="gap-2">
                        <Building className="h-4 w-4" />
                        Fornecedores
                    </TabsTrigger>
                    <TabsTrigger value="persons" className="gap-2">
                        <User className="h-4 w-4" />
                        Pessoas
                    </TabsTrigger>
                </TabsList>

                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle>Listagem de {activeTab === 'products' ? 'Produtos' : activeTab === 'suppliers' ? 'Fornecedores' : 'Clientes/Mecânicos'}</CardTitle>
                                <CardDescription>
                                    Exibindo {filteredItems.length} registros que {pendingOnly ? 'precisam de' : 'possuem'} código externo.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant={pendingOnly ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPendingOnly(!pendingOnly)}
                                >
                                    {pendingOnly ? "Ver Todos" : "Apenas Pendentes"}
                                </Button>
                                <SearchInput
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClear={() => setSearchTerm('')}
                                    className="w-full md:w-[250px]"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{activeTab === 'products' ? 'Descrição / Código' : 'Nome / Documento'}</TableHead>
                                        <TableHead className="w-[300px]">Código Externo (ERP)</TableHead>
                                        <TableHead className="w-[100px] text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {item.descricao || item.nome || item.nomeFantasia}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {item.codigo || item.cnpj || item.cpfCnpj || '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative group">
                                                        <Input
                                                            placeholder="Digite o código externo..."
                                                            defaultValue={item.codigoExterno || ''}
                                                            onBlur={(e) => handleUpdate(item, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleUpdate(item, e.currentTarget.value);
                                                                    // Move to next row if possible (UX polish)
                                                                }
                                                            }}
                                                            className={cn(
                                                                "h-9 border-muted group-hover:border-primary transition-all",
                                                                item.codigoExterno && "border-green-100 bg-green-50/30"
                                                            )}
                                                        />
                                                        {savingId === item.id && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.codigoExterno ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 text-amber-500 mx-auto" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                                {searchTerm ? 'Nenhum registro encontrado para esta busca.' : 'Todos os registros desta categoria já possuem código externo.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
