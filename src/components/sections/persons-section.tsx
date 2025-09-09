
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Person, PersonType } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  type: z.enum(['Cliente', 'Mecânico', 'Ambos'], { required_error: 'Selecione um tipo.' }),
});

type PersonFormValues = z.infer<typeof formSchema>;

export default function PersonsSection() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', type: 'Cliente' },
  });
  const { isSubmitting } = form.formState;

  const loadPersons = useCallback(async () => {
    try {
      const allPersons = await db.getAllPersons();
      setPersons(allPersons.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load persons:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar os registros.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    async function initializeDB() {
      if (isDbReady) {
        loadPersons();
        return;
      }
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadPersons();
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
  }, [loadPersons, toast, isDbReady]);

  useEffect(() => {
    form.reset(editingPerson ? { name: editingPerson.name, type: editingPerson.type } : { name: '', type: 'Cliente' });
  }, [editingPerson, form]);
  
  const handleSave = async (data: PersonFormValues) => {
    try {
      if (editingPerson?.id) {
        await db.updatePerson({ ...data, id: editingPerson.id });
        toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' });
      } else {
        await db.addPerson(data);
        toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' });
      }
      setEditingPerson(null);
      form.reset({ name: '', type: 'Cliente' });
      await loadPersons();
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to save person:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o registro.',
        variant: 'destructive',
      });
    }
  };

  const handleClearForm = () => {
    setEditingPerson(null);
    form.reset({ name: '', type: 'Cliente' });
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deletePerson(id);
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso.',
      });
      await loadPersons();
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to delete person:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o registro.',
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
  
  const getTypeVariant = (type: PersonType) => {
    switch (type) {
      case 'Cliente':
        return 'secondary';
      case 'Mecânico':
        return 'outline';
      case 'Ambos':
        return 'default';
      default:
        return 'secondary';
    }
  };


  return (
    <div className='grid gap-8 md:grid-cols-3'>
      <div className="md:col-span-1">
        <Card className="shadow-lg sticky top-24">
          <CardHeader>
            <CardTitle>{editingPerson ? 'Editar Registro' : 'Novo Cliente/Mecânico'}</CardTitle>
            <CardDescription>Preencha os dados abaixo.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <CardContent className="space-y-4">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Cliente" />
                            </FormControl>
                            <FormLabel className="font-normal">Cliente</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Mecânico" />
                            </FormControl>
                            <FormLabel className="font-normal">Mecânico</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Ambos" />
                            </FormControl>
                            <FormLabel className="font-normal">Ambos</FormLabel>
                          </FormItem>
                        </RadioGroup>
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
                  {editingPerson ? 'Atualizar' : 'Salvar'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Registros</CardTitle>
            <CardDescription>Lista de todos os clientes e mecânicos cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {persons.length > 0 ? (
                    persons.map(person => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">{person.name}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeVariant(person.type)}>{person.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingPerson(person)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(person)} className="text-destructive focus:text-destructive">
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
                      <TableCell colSpan={3} className="h-24 text-center">
                        Nenhum registro encontrado.
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de <span className="font-bold">{deleteTarget?.name}</span>.
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
