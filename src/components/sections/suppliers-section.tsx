
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
  razaoSocial: z.string().min(2, { message: 'A razão social deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z.string().min(2, { message: 'O nome fantasia deve ter pelo menos 2 caracteres.' }),
  cnpj: z.string().optional(),
  cidade: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof formSchema>;

const defaultFormValues: SupplierFormValues = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  cidade: ''
};

export default function SuppliersSection() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });
  const { isSubmitting } = form.formState;

  const loadSuppliers = useCallback(async () => {
    try {
      const allSuppliers = await db.getAllSuppliers();
      setSuppliers(allSuppliers.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)));
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
    form.reset(editingSupplier ? editingSupplier : defaultFormValues);
  }, [editingSupplier, form]);

  const handleSave = async (data: SupplierFormValues) => {
    try {
      const dataToSave = {
        ...data,
        cnpj: data.cnpj || '',
        cidade: data.cidade || ''
      };

      if (editingSupplier?.id) {
        await db.updateSupplier({ ...dataToSave, id: editingSupplier.id });
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado com sucesso.' });
      } else {
        await db.addSupplier(dataToSave);
        toast({ title: 'Sucesso', description: 'Fornecedor salvo com sucesso.' });
      }
      setEditingSupplier(null);
      form.reset(defaultFormValues);
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
    form.reset(defaultFormValues);
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
            <CardDescription>Preencha os dados do fornecedor abaixo.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <CardContent className="space-y-4">
                <FormField
                  name="nomeFantasia"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da Empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="razaoSocial"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Razão Social Ltda." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="cnpj"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="cidade"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade - UF" {...field} />
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
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length > 0 ? (
                    suppliers.map(supplier => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.nomeFantasia}</TableCell>
                        <TableCell>{supplier.razaoSocial}</TableCell>
                        <TableCell>{supplier.cnpj}</TableCell>
                        <TableCell>{supplier.cidade}</TableCell>
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
                      <TableCell colSpan={5} className="h-24 text-center">
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor <span className="font-bold">{deleteTarget?.nomeFantasia}</span>.
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
