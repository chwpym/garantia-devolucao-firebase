'use client';

import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { Warranty } from '@/lib/types';
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

interface ImportButtonProps {
  onDataImported: () => void;
}

export function ImportButton({ onDataImported }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [warrantiesToImport, setWarrantiesToImport] = useState<Warranty[]>([]);
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
        const data = JSON.parse(text) as unknown;
        if (!Array.isArray(data)) {
          throw new Error('O arquivo JSON deve conter um array de garantias.');
        }

        // Basic validation of imported data
        const validWarranties = data.filter((item): item is Warranty => typeof item === 'object' && item !== null && ('codigo' in item || 'descricao' in item));
        
        setWarrantiesToImport(validWarranties);
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
    setShowConfirm(false);
    setIsLoading(true);
    try {
        await db.clearWarranties();
        for (const warranty of warrantiesToImport) {
            const { id: _, ...warrantyData } = warranty;
            await db.addWarranty(warrantyData);
        }
        onDataImported();
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
        Importar de JSON
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação de Dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação <span className="font-bold text-destructive">substituirá todos os dados existentes</span> com o conteúdo do arquivo selecionado.
              Você está prestes a importar <span className="font-bold">{warrantiesToImport.length}</span> registros. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              Sim, substituir e importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
