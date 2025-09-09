
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
});

type SupplierFormValues = z.infer<typeof formSchema>;

export default function SuppliersSection() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });
  const { isSubmitting } = form.formState;

  const loadSuppliers = useCallback(async () => {
    try {
      const allSuppliers = await db.getAllSuppliers();
      setSuppliers(allSuppliers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar os fornecedores.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    async function initializeDB() {
      if (isDbReady) {
        loadSuppliers();
        return;
      }
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadSuppliers();
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
  }, [loadSuppliers, toast, isDbReady]);
  
  useEffect(() => {
    form.reset(editingSupplier ? { name: editingSupplier.name } : { name: '' });
  }, [editingSupplier, form]);

  const handleSave = async (data: SupplierFormValues) => {
    try {
      if (editingSupplier?.id) {
        await db.updateSupplier({ ...data, id: editingSupplier.id });
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado com sucesso.' });
      } else {
        await db.addSupplier(data);
        toast({ title: 'Sucesso', description: 'Fornecedor salvo com sucesso.' });
      }
      setEditingSupplier(null);
      form.reset({ name: '' });
      await loadSuppliers();
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to save supplier:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o fornecedor.',
        variant: 'destructive',
      });
    }
  };

  const handleClearForm = () => {
    setEditingSupplier(null);
    form.reset({ name: '' });
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteSupplier(id);
      toast({
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso.',
      });
      await loadSuppliers();
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o fornecedor.',
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
    <div className='grid gap-8 md:grid-cols-3'>
      <div className="md:col-span-1">
        <Card className="shadow-lg sticky top-24">
          <CardHeader>
            <CardTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</CardTitle>
            <CardDescription>Preencha o nome do fornecedor abaixo.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <CardContent>
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Fornecedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da Empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClearForm}>Limpar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingSupplier ? 'Atualizar' : 'Salvar'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Fornecedores Cadastrados</CardTitle>
            <CardDescription>Lista de todos os fornecedores.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length > 0 ? (
                    suppliers.map(supplier => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(supplier)} className="text-destructive focus:text-destructive">
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
                      <TableCell colSpan={2} className="h-24 text-center">
                        Nenhum fornecedor encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor <span className="font-bold">{deleteTarget?.name}</span>.
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
