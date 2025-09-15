
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Person } from '@/lib/types';
import * as db from '@/lib/db';
import { generatePersonsPdf } from '@/lib/pdf-generator';

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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2, PlusCircle, Download, Search } from 'lucide-react';
import PersonForm from '../person-form';
import { Input } from '../ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  const loadPersons = useCallback(async () => {
    try {
      const allPersons = await db.getAllPersons();
      setPersons(allPersons.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
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
  
  const filteredPersons = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    if (!lowercasedTerm) return persons;

    return persons.filter(person => 
        person.nome.toLowerCase().includes(lowercasedTerm) ||
        (person.cpfCnpj && person.cpfCnpj.replace(/\D/g, '').includes(lowercasedTerm.replace(/\D/g, ''))) ||
        (person.telefone && person.telefone.toLowerCase().includes(lowercasedTerm))
    );
  }, [persons, searchTerm]);


  const handleSave = () => {
    setEditingPerson(null);
    setIsFormModalOpen(false);
  };
  
  const handleEditClick = (person: Person) => {
    setEditingPerson(person);
    setIsFormModalOpen(true);
  }

  const handleDelete = async (id: number) => {
    try {
      await db.deletePerson(id);
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso.',
      });
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
  
  const handleGenerateReport = async () => {
    try {
        const companyData = await db.getCompanyData();
        const pdfDataUri = generatePersonsPdf({
            persons,
            companyData,
        });
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = pdfDataUri;
        link.download = `relatorio_clientes_${date}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Sucesso',
          description: 'Seu relatório de clientes foi gerado.',
        });
    } catch (error) {
         console.error('Failed to generate PDF:', error);
        toast({
            title: 'Erro ao Gerar PDF',
            description: 'Não foi possível gerar o relatório. Tente novamente.',
            variant: 'destructive',
        });
    }
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
    <div className='space-y-8'>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clientes e Mecânicos</h1>
                <p className="text-lg text-muted-foreground">
                    Gerencie seus clientes e mecânicos cadastrados.
                </p>
            </div>
            <div className='flex gap-2'>
                <Button variant="outline" onClick={handleGenerateReport} disabled={persons.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Relatório
                </Button>
                <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
                    setIsFormModalOpen(isOpen);
                    if (!isOpen) {
                        setEditingPerson(null);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Cadastrar Novo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingPerson ? 'Editar Registro' : 'Novo Cliente/Mecânico'}</DialogTitle>
                            <DialogDescription>Preencha os dados abaixo.</DialogDescription>
                        </DialogHeader>
                         <div className='py-4 max-h-[70vh] overflow-y-auto'>
                             <PersonForm 
                                onSave={handleSave}
                                editingPerson={editingPerson}
                                onClear={() => setEditingPerson(null)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Registros Cadastrados</CardTitle>
            <CardDescription>Lista de todos os clientes e mecânicos cadastrados no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
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
                    <TableHead className='w-[80px]'>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersons.length > 0 ? (
                    filteredPersons.map(person => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium text-muted-foreground">{person.id}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleEditClick(person)}>
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum registro encontrado para a busca realizada.
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
