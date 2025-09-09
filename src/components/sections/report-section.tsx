'use client';

import { useEffect, useState } from 'react';
import ReportGenerator from '@/components/report-generator';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportSection() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    async function loadWarranties() {
      try {
        await db.initDB();
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
    }
    loadWarranties();
  }, [toast]);

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
  
  const isAllSelected = warranties.length > 0 && selectedIds.size === warranties.length;

  return (
    <div className="space-y-8">
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Seleção de Garantias para Relatório</CardTitle>
          <CardDescription>
            Marque as garantias que você deseja incluir no relatório em PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Defeito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.length > 0 ? (
                  warranties.map(warranty => (
                    <TableRow key={warranty.id} data-state={selectedIds.has(warranty.id!) ? 'selected' : ''}>
                      <TableCell className="text-center">
                        <Checkbox
                            checked={selectedIds.has(warranty.id!)}
                            onCheckedChange={() => handleSelectionChange(warranty.id!)}
                            aria-label={`Selecionar garantia ${warranty.codigo}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                      <TableCell>{warranty.descricao || '-'}</TableCell>
                      <TableCell>{warranty.cliente || '-'}</TableCell>
                      <TableCell>{warranty.defeito || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma garantia registrada para selecionar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <ReportGenerator selectedWarrantyIds={Array.from(selectedIds)} />
    </div>
  );
}
