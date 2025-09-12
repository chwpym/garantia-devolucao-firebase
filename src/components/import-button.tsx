'use client';

import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { Warranty, Devolucao, Lote, Person, Supplier, CompanyData, ItemDevolucao } from '@/lib/types';
import { Loader2, Upload } from 'lucide-react';
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


interface FullBackupData {
  warranties?: Warranty[];
  persons?: Person[];
  suppliers?: Supplier[];
  lotes?: Lote[];
  devolucoes?: (Omit<Devolucao, 'id'> & { id?: number; itens: (Omit<ItemDevolucao, 'id' | 'devolucaoId'>)[] })[];
  companyData?: CompanyData;
}


interface ImportButtonProps {
  onDataImported: () => void;
}

export function ImportButton({ onDataImported }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dataToImport, setDataToImport] = useState<FullBackupData | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Formato de arquivo inválido.');
        }
        const data: FullBackupData = JSON.parse(text);

        // Check for old format (just an array of warranties) for backward compatibility
        if (Array.isArray(data) && data.every((item: unknown) => typeof item === 'object' && item !== null && ('codigo' in item || 'descricao' in item))) {
            setDataToImport({ warranties: data as Warranty[] });
            setShowConfirm(true);
            return;
        }

        if (!data || (
          !Array.isArray(data.warranties) &&
          !Array.isArray(data.persons) &&
          !Array.isArray(data.suppliers) &&
          !Array.isArray(data.lotes) &&
          !Array.isArray(data.devolucoes) &&
          !data.companyData
        )) {
            throw new Error('O arquivo de backup não parece ter um formato válido.');
        }
        
        setDataToImport(data);
        setShowConfirm(true);
        
      } catch (error) {
        toast({
          title: 'Erro ao Ler Arquivo',
          description: error instanceof Error ? error.message : 'O arquivo selecionado não é um JSON válido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (!dataToImport) return;
    setShowConfirm(false);
    setIsLoading(true);

    try {
        // Clear all existing data
        await Promise.all([
            db.clearWarranties(),
            db.clearPersons(),
            db.clearSuppliers(),
            db.clearLotes(),
            db.clearDevolucoes(),
            db.clearCompanyData(),
        ]);

        // Import new data
        if (dataToImport.warranties) {
            for (const { ...warrantyData } of dataToImport.warranties) {
                await db.addWarranty(warrantyData);
            }
        }
        if (dataToImport.persons) {
            for (const { ...personData } of dataToImport.persons) {
                await db.addPerson(personData);
            }
        }
        if (dataToImport.suppliers) {
            for (const { ...supplierData } of dataToImport.suppliers) {
                await db.addSupplier(supplierData);
            }
        }
        if (dataToImport.lotes) {
            for (const { ...loteData } of dataToImport.lotes) {
                await db.addLote(loteData);
            }
        }
        if (dataToImport.devolucoes) {
            for (const { itens, ...devolucaoData } of dataToImport.devolucoes) {
                await db.addDevolucao(devolucaoData, itens || []);
            }
        }
        if (dataToImport.companyData) {
            const { ...companyData } = dataToImport.companyData;
            await db.updateCompanyData(companyData);
        }

        onDataImported();
        window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
        console.error('Failed to import data:', error);
        toast({
            title: 'Erro na Importação',
            description: 'Não foi possível importar os dados. Verifique o console para mais detalhes.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const getImportSummary = () => {
    if (!dataToImport) return "Nenhum registro a ser importado."
    const counts = [
        dataToImport.warranties?.length || 0,
        dataToImport.persons?.length || 0,
        dataToImport.suppliers?.length || 0,
        dataToImport.lotes?.length || 0,
        dataToImport.devolucoes?.length || 0,
    ];
    const totalRecords = counts.reduce((acc, count) => acc + count, 0);
    return `Você está prestes a importar um total de ${totalRecords} registros em várias categorias. Deseja continuar?`
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="application/json"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Restaurar de um Backup
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração de Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação <span className="font-bold text-destructive">substituirá todos os dados existentes no sistema</span> com o conteúdo do arquivo de backup selecionado.
              <br/><br/>
              {getImportSummary()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              Sim, substituir e restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
