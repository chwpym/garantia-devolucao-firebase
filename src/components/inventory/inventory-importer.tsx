'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseTxtInventory, parseXlsInventory, InventoryParseResult } from '@/lib/inventory-parser';
import * as db from '@/lib/db';
import { Product } from '@/lib/types';
import { useAppStore } from '@/store/app-store';

export default function InventoryImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<InventoryParseResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const reloadData = useAppStore(state => state.reloadData);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('parsing');
    setProgress(10);
    setResult(null);

    try {
      let parseResult: InventoryParseResult;
      
      // Checa a extensão
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'txt') {
        const text = await file.text();
        parseResult = parseTxtInventory(text);
      } else if (ext === 'xls' || ext === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer();
        parseResult = await parseXlsInventory(arrayBuffer);
      } else {
        throw new Error('Formato de arquivo não suportado. Envie .TXT, .XLS ou .XLSX.');
      }

      setProgress(50);
      setResult(parseResult);
      setStatus('idle');
      
      if (parseResult.errors.length > 0) {
        toast({
          title: 'Aviso de Parsing',
          description: `Ocorreram alguns erros ao ler o arquivo: ${parseResult.errors[0]}`,
          variant: 'destructive'
        });
      }

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      toast({
        title: 'Erro na Leitura',
        description: error.message || 'Falha ao processar arquivo.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveToDB = async () => {
    if (!result || result.products.length === 0) return;

    setIsProcessing(true);
    setStatus('saving');
    setProgress(50);

    try {
      // 1. Carregar códigos já existentes para não duplicar
      const existingProducts = await db.getAllProducts();
      const existingCodes = new Set(existingProducts.map(p => p.codigoExterno).filter(Boolean));

      const products = result.products;
      const total = products.length;
      let saved = 0;
      let skipped = 0;
      
      // Processar em chunks para não travar a UI (batches de 500)
      const chunkSize = 500;
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        
        const promises = chunk.map(async (prod) => {
          // Se já existe, pula
          if (prod.codigoExterno && existingCodes.has(prod.codigoExterno)) {
            skipped++;
            return;
          }

          // Salva com código temporário
          const tempCod = `TMP_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const productToSave = { 
            descricao: prod.descricao || 'SEM DESCRIÇÃO',
            codigoExterno: prod.codigoExterno || '',
            referencia: prod.referencia || '',
            marca: prod.marca || '',
            codigo: tempCod 
          } as Omit<Product, 'id'>;
          
          try {
            const id = await db.addProduct(productToSave);
            // Atualiza o código para o próprio ID, conforme regra estabelecida
            await db.updateProduct({ ...productToSave, id, codigo: String(id) } as Product);
            
            // Adiciona ao set para evitar duplicidade no mesmo arquivo
            if (prod.codigoExterno) {
              existingCodes.add(prod.codigoExterno);
            }
          } catch (e) {
            console.warn('Erro ao salvar produto:', prod.codigoExterno, e);
          }
        });

        await Promise.allSettled(promises);
        
        saved += chunk.length;
        setProgress(50 + Math.floor((saved / total) * 50));
        
        // Pequena pausa para o React renderizar o progresso
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setStatus('done');
      setProgress(100);
      toast({
        title: 'Importação Concluída',
        description: `${total} produtos importados com sucesso para o banco de dados.`,
      });
      
      await reloadData('products');
      window.dispatchEvent(new CustomEvent('datachanged'));

      // Fecha o modal após 2 segundos
      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      toast({
        title: 'Erro ao Salvar',
        description: 'Ocorreu um erro ao gravar no banco de dados.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setResult(null);
    setProgress(0);
    setStatus('idle');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isProcessing) {
        setIsOpen(open);
        if (!open) resetState();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
          <Upload className="h-4 w-4" />
          Importar ERP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Catálogo do ERP</DialogTitle>
          <DialogDescription>
            Envie um arquivo <b>.TXT</b> (largura fixa) ou <b>.XLS</b> contendo os produtos.
            Os registros serão adicionados ao banco de dados e o ID interno será o Código principal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          
          {status === 'idle' && !result && (
            <div 
              className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-center">
                Clique para selecionar o arquivo<br />
                <span className="text-xs text-muted-foreground">(.TXT ou .XLS suportados)</span>
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.xls,.xlsx"
                onChange={handleFileChange}
              />
            </div>
          )}

          {(status === 'parsing' || status === 'saving') && (
            <div className="w-full space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>{status === 'parsing' ? 'Lendo arquivo...' : 'Salvando no banco de dados...'}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === 'idle' && result && (
            <div className="w-full space-y-4">
              <div className="bg-primary/10 p-4 rounded-md border border-primary/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Leitura Concluída</h4>
                  <p className="text-xs text-muted-foreground">
                    Encontramos <b>{result.products.length}</b> produtos válidos (de {result.totalLines} linhas totais).
                  </p>
                </div>
              </div>
              
              <div className="max-h-[150px] overflow-y-auto rounded-md border text-sm">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-medium text-xs">Cód. ERP</th>
                      <th className="p-2 text-left font-medium text-xs">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.products.slice(0, 50).map((p, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 text-xs font-mono text-muted-foreground">{p.codigoExterno}</td>
                        <td className="p-2 text-xs truncate max-w-[200px]">{p.descricao}</td>
                      </tr>
                    ))}
                    {result.products.length > 50 && (
                      <tr className="border-t">
                        <td colSpan={2} className="p-2 text-xs text-center text-muted-foreground bg-muted/30">
                          ... e mais {result.products.length - 50} itens
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <Button variant="outline" className="flex-1" onClick={resetState}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSaveToDB}>Confirmar Importação</Button>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="w-full flex flex-col items-center justify-center space-y-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="font-semibold text-lg">Sucesso!</h3>
              <p className="text-sm text-center text-muted-foreground">
                Os produtos foram cadastrados. O modal será fechado.
              </p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
