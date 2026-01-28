
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import * as db from '@/lib/db';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, PlusCircle, ArrowUpDown } from 'lucide-react';
import ProductForm from '../product-form';
import { smartSearch } from '@/lib/search-utils';
import { SearchInput } from '@/components/ui/search-input';
import { usePersistedFilters } from '@/hooks/use-persisted-filters';

type SortableKeys = keyof Product;


export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const initialFilters = useMemo(() => ({
    searchTerm: '',
    sortConfig: { key: 'descricao' as SortableKeys, direction: 'ascending' as 'ascending' | 'descending' }
  }), []);

  const { filters, setFilters } = usePersistedFilters('products-list', initialFilters);
  const { searchTerm, sortConfig } = filters;

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      const allProducts = await db.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    async function initializeDB() {
      if (isDbReady) {
        loadProducts();
        return;
      }
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadProducts();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast({
          title: 'Erro de Banco de Dados',
          description: 'Não foi possível carregar o banco de dados local.',
          variant: 'destructive',
        });
      }
    }
    initializeDB();

    window.addEventListener('datachanged', loadProducts);
    return () => {
      window.removeEventListener('datachanged', loadProducts);
    };
  }, [loadProducts, toast, isDbReady]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;

    return products.filter(product =>
      smartSearch(product, searchTerm, ['codigo', 'descricao', 'marca', 'referencia'])
    );
  }, [products, searchTerm]);


  const sortedProducts = useMemo(() => {
    const sortableItems = [...filteredProducts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB, 'pt-BR') * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }

        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const handleSave = () => {
    setEditingProduct(null);
    setIsFormModalOpen(false);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  }

  const handleDelete = async (id: number) => {
    try {
      await db.deleteProduct(id);
      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso.',
      });
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = () => {
    if (deleteTarget?.id) {
      handleDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setFilters({ ...filters, sortConfig: { key, direction } });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: SortableKeys, children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="group px-2">
        {children}
        {getSortIcon(sortKey)}
      </Button>
    </TableHead>
  );

  return (
    <div className='space-y-8'>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-lg text-muted-foreground">
            Gerencie seu catálogo de produtos.
          </p>
        </div>
        <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) {
            setEditingProduct(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>Preencha os dados do produto abaixo.</DialogDescription>
            </DialogHeader>
            <ProductForm
              onSave={handleSave}
              editingProduct={editingProduct}
              onClear={() => setEditingProduct(null)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>Lista de todos os produtos do seu catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <SearchInput
              placeholder="Buscar por código, descrição, marca ou referência..."
              value={searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              onClear={() => setFilters({ ...filters, searchTerm: '' })}
              className="w-full"
              containerClassName="relative flex-1 max-w-full"
            />
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey='codigo'>Código</SortableHeader>
                  <SortableHeader sortKey='descricao'>Descrição</SortableHeader>
                  <SortableHeader sortKey='marca'>Marca</SortableHeader>
                  <SortableHeader sortKey='referencia'>Referência</SortableHeader>
                  <TableHead className="w-[50px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.length > 0 ? (
                  sortedProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.codigo}</TableCell>
                      <TableCell>{product.descricao}</TableCell>
                      <TableCell>{product.marca || '-'}</TableCell>
                      <TableCell>{product.referencia || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(product)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto <span className="font-bold">{deleteTarget?.descricao}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
