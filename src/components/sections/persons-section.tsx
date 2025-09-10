
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Person } from '@/lib/types';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import PersonForm from '../person-form';

const formatCpfCnpj = (value?: string) => {
    if (!value) return '-';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) { // CPF
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cleaned.length === 14) { // CNPJ
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
};


export default function PersonsSection() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const loadPersons = useCallback(async () => {
    try {
      const allPersons = await db.getAllPersons();
      setPersons(allPersons.sort((a, b) => a.nome.localeCompare(b.nome)));
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
    
    window.addEventListener('datachanged', loadPersons);
    return () => {
      window.removeEventListener('datachanged', loadPersons);
    };
  }, [loadPersons, toast, isDbReady]);


  const handleSave = () => {
    setEditingPerson(null);
  };

  const handleClearForm = () => {
    setEditingPerson(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deletePerson(id);
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso.',
      });
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
  
  const getTypeVariant = (type: Person['tipo']) => {
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
    <div className='grid gap-8 lg:grid-cols-3'>
      <div className="lg:col-span-1">
        <Card className="shadow-lg sticky top-24">
          <CardHeader>
            <CardTitle>{editingPerson ? 'Editar Registro' : 'Novo Cliente/Mecânico'}</CardTitle>
            <CardDescription>Preencha os dados abaixo.</CardDescription>
          </CardHeader>
          <PersonForm 
            onSave={handleSave}
            editingPerson={editingPerson}
            onClear={handleClearForm}
          />
        </Card>
      </div>

      <div className="lg:col-span-2">
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
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {persons.length > 0 ? (
                    persons.map(person => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">{person.nome}</TableCell>
                        <TableCell>{formatCpfCnpj(person.cpfCnpj)}</TableCell>
                        <TableCell>{person.telefone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeVariant(person.tipo)}>{person.tipo}</Badge>
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
                      <TableCell colSpan={5} className="h-24 text-center">
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de <span className="font-bold">{deleteTarget?.nome}</span>.
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
