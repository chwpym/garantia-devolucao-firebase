
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
import { MoreHorizontal, Pencil, Trash2, PlusCircle, Search } from 'lucide-react';
import ProductForm from '../product-form';
import { Input } from '../ui/input';

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      const allProducts = await db.getAllProducts();
      setProducts(allProducts.sort((a, b) => a.descricao.localeCompare(b.descricao)));
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
    const lowercasedTerm = searchTerm.toLowerCase();
    if (!lowercasedTerm) return products;

    return products.filter(product => 
        product.codigo.toLowerCase().includes(lowercasedTerm) ||
        product.descricao.toLowerCase().includes(lowercasedTerm) ||
        (product.marca && product.marca.toLowerCase().includes(lowercasedTerm)) ||
        (product.referencia && product.referencia.toLowerCase().includes(lowercasedTerm))
    );
  }, [products, searchTerm]);

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
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por código, descrição, marca ou referência..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10"
                    />
                </div>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
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

    