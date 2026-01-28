
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Supplier } from '@/lib/types';
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
import SupplierForm from '../supplier-form';
import { smartSearch } from '@/lib/search-utils';
import { SearchInput } from '@/components/ui/search-input';


const formatCnpj = (value?: string) => {
  if (!value) return '-';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 14) { // CNPJ
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};

type SortableKeys = keyof Supplier;

export default function SuppliersSection() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'ascending' | 'descending' } | null>({ key: 'nomeFantasia', direction: 'ascending' });
  const { toast } = useToast();

  const loadSuppliers = useCallback(async () => {
    try {
      const allSuppliers = await db.getAllSuppliers();
      setSuppliers(allSuppliers);
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

    window.addEventListener('datachanged', loadSuppliers);
    return () => {
      window.removeEventListener('datachanged', loadSuppliers);
    };
  }, [loadSuppliers, toast, isDbReady]);

  const filteredSuppliers = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    if (!lowercasedTerm) return suppliers;

    return suppliers.filter(supplier =>
      smartSearch(supplier, searchTerm, ['nomeFantasia', 'razaoSocial', 'cnpj'])
    );

    // ... (in JSX)
    <div className="mb-4">
      <SearchInput
        placeholder="Buscar por Nome Fantasia, Razão Social ou CNPJ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onClear={() => setSearchTerm('')}
        className="w-full"
        containerClassName="max-w-full"
      />
    </div>
  }, [suppliers, searchTerm]);

  const sortedSuppliers = useMemo(() => {
    const sortableItems = [...filteredSuppliers];
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
  }, [filteredSuppliers, sortConfig]);


  const handleSave = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(false);
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  }

  const handleDelete = async (id: number) => {
    try {
      await db.deleteSupplier(id);
      toast({
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso.',
      });
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

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-lg text-muted-foreground">
            Gerencie seus fornecedores cadastrados.
          </p>
        </div>
        <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) {
            setEditingSupplier(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
              <DialogDescription>Preencha os dados do fornecedor abaixo.</DialogDescription>
            </DialogHeader>
            <SupplierForm
              onSave={handleSave}
              editingSupplier={editingSupplier}
              onClear={() => setEditingSupplier(null)}
              isModal={true}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
          <CardDescription>Lista de todos os fornecedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <SearchInput
              placeholder="Buscar por Nome Fantasia, Razão Social ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              className="w-full"
              containerClassName="max-w-full"
            />
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey='id'>ID</SortableHeader>
                  <SortableHeader sortKey='nomeFantasia'>Nome Fantasia</SortableHeader>
                  <SortableHeader sortKey='razaoSocial'>Razão Social</SortableHeader>
                  <SortableHeader sortKey='cnpj'>CNPJ</SortableHeader>
                  <SortableHeader sortKey='cidade'>Cidade</SortableHeader>
                  <TableHead className="w-[50px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSuppliers.length > 0 ? (
                  sortedSuppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium text-muted-foreground">{supplier.id}</TableCell>
                      <TableCell className="font-medium">{supplier.nomeFantasia}</TableCell>
                      <TableCell>{supplier.razaoSocial}</TableCell>
                      <TableCell>{formatCnpj(supplier.cnpj)}</TableCell>
                      <TableCell>{supplier.cidade || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(supplier)}>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum fornecedor encontrado para a busca realizada.
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
