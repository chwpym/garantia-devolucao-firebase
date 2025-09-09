'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';

import WarrantyForm from '@/components/warranty-form';
import WarrantyTable from '@/components/warranty-table';
import ReportGenerator from '@/components/report-generator';
import { Logo } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function initializeDB() {
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadWarranties();
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
  }, [toast]);

  const loadWarranties = async () => {
    try {
      const allWarranties = await db.getAllWarranties();
      setWarranties(allWarranties.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    } catch (error) {
      console.error('Failed to load warranties:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as garantias.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (data: Omit<Warranty, 'id'>, id?: number) => {
    try {
      if (id) {
        await db.updateWarranty({ ...data, id });
        toast({ title: 'Sucesso', description: 'Garantia atualizada com sucesso.' });
      } else {
        await db.addWarranty(data);
        toast({ title: 'Sucesso', description: 'Garantia salva com sucesso.' });
      }
      setEditingWarranty(null);
      await loadWarranties();
    } catch (error) {
      console.error('Failed to save warranty:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a garantia.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteWarranty(id);
      toast({ title: 'Sucesso', description: 'Garantia excluída com sucesso.' });
      setEditingWarranty(null);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      await loadWarranties();
    } catch (error) {
      console.error('Failed to delete warranty:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir a garantia.',
        variant: 'destructive',
      });
    }
  };

  const handleClearForm = () => {
    setEditingWarranty(null);
  };
  
  const handleSelectionChange = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(warranties.map(w => w.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  if (!isDbReady) {
    return (
       <div className="flex flex-col min-h-screen">
        <header className="p-6 border-b bg-card">
          <div className="container mx-auto flex items-center gap-4">
             <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-60 mt-2" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-[700px] w-full" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:p-6 border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Logo className="h-10 w-10 text-primary-foreground fill-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Warranty Wise
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Controle de Garantias Local e Offline
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 sticky top-24">
            <WarrantyForm
              key={editingWarranty?.id ?? 'new'}
              selectedWarranty={editingWarranty}
              onSave={handleSave}
              onClear={handleClearForm}
            />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <WarrantyTable
              warranties={warranties}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRowSelect={handleSelectionChange}
              onSelectAll={handleSelectAll}
              selectedIds={selectedIds}
            />
            <ReportGenerator
              selectedWarrantyIds={Array.from(selectedIds)}
            />
          </div>
        </div>
      </main>
       <footer className="p-4 border-t bg-card text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Warranty Wise. All rights reserved.</p>
      </footer>
    </div>
  );
}
