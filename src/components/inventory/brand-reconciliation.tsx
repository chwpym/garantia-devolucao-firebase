'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Wrench, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/lib/types';

interface BrandStat {
  name: string;
  count: number;
}

export default function BrandReconciliation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done'>('idle');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [newBrandName, setNewBrandName] = useState('');

  const { toast } = useToast();
  const reloadData = useAppStore(state => state.reloadData);

  // Carrega produtos ao abrir
  useEffect(() => {
    if (isOpen && status === 'idle') {
      loadData();
    }
  }, [isOpen, status]);

  const loadData = async () => {
    setStatus('loading');
    try {
      const allProducts = await db.getAllProducts();
      setProducts(allProducts);
      setStatus('idle');
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar produtos.', variant: 'destructive' });
      setIsOpen(false);
    }
  };

  // Agrupa as marcas e conta as ocorrências
  const brandStats = useMemo(() => {
    const stats = new Map<string, number>();
    products.forEach(p => {
      const marca = (p.marca || '').trim().toUpperCase();
      stats.set(marca, (stats.get(marca) || 0) + 1);
    });

    const arr: BrandStat[] = Array.from(stats.entries()).map(([name, count]) => ({
      name: name === '' ? '(SEM MARCA)' : name,
      count
    }));

    // Ordena por quantidade desc, e depois alfabeticamente
    return arr.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products]);

  // Filtra as marcas pela busca
  const filteredBrands = useMemo(() => {
    if (!searchTerm) return brandStats;
    const lowerSearch = searchTerm.toLowerCase();
    return brandStats.filter(b => b.name.toLowerCase().includes(lowerSearch));
  }, [brandStats, searchTerm]);

  const toggleBrand = (brandName: string) => {
    const next = new Set(selectedBrands);
    if (next.has(brandName)) next.delete(brandName);
    else next.add(brandName);
    setSelectedBrands(next);
  };

  const handleApply = async () => {
    if (selectedBrands.size === 0) {
      toast({ title: 'Aviso', description: 'Selecione pelo menos uma marca para padronizar.', variant: 'destructive' });
      return;
    }

    const finalName = newBrandName.trim().toUpperCase();
    if (!finalName) {
      toast({ title: 'Aviso', description: 'Digite o novo nome da marca.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setStatus('processing');
    setProgress(0);

    try {
      // Filtra quais produtos precisam ser alterados
      // O Set guarda os nomes exatos como aparecem na UI. Cuidado com o (SEM MARCA).
      const productsToUpdate = products.filter(p => {
        const marca = (p.marca || '').trim().toUpperCase();
        const displayMarca = marca === '' ? '(SEM MARCA)' : marca;
        return selectedBrands.has(displayMarca);
      });

      const total = productsToUpdate.length;
      let saved = 0;
      const chunkSize = 500;

      for (let i = 0; i < total; i += chunkSize) {
        const chunk = productsToUpdate.slice(i, i + chunkSize);
        
        const promises = chunk.map(async (prod) => {
          const updatedProd = { ...prod, marca: finalName };
          await db.updateProduct(updatedProd);
        });

        await Promise.allSettled(promises);
        
        saved += chunk.length;
        setProgress(Math.floor((saved / total) * 100));
        
        // Pausa para renderizar o UI
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setStatus('done');
      toast({
        title: 'Padronização Concluída',
        description: `${total} produtos foram atualizados para a marca "${finalName}".`,
      });
      
      await reloadData('products');
      window.dispatchEvent(new CustomEvent('datachanged'));

      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Ocorreu um erro ao atualizar os produtos.',
        variant: 'destructive'
      });
      setStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setProgress(0);
    setStatus('idle');
    setSelectedBrands(new Set());
    setNewBrandName('');
    setSearchTerm('');
  };

  const affectedProductsCount = useMemo(() => {
    let count = 0;
    selectedBrands.forEach(b => {
      const stat = brandStats.find(s => s.name === b);
      if (stat) count += stat.count;
    });
    return count;
  }, [selectedBrands, brandStats]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isProcessing) {
        setIsOpen(open);
        if (!open) resetState();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
          <Wrench className="h-4 w-4" />
          Padronizar Marcas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Padronização em Lote (Marcas)</DialogTitle>
          <DialogDescription>
            Selecione uma ou mais variações incorretas e defina o nome oficial. O sistema atualizará todos os produtos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4 py-2">
          {status === 'loading' && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Carregando catálogo...
            </div>
          )}

          {status === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <h3 className="font-semibold text-lg animate-pulse">Aplicando padronização...</h3>
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-sm mb-1">
                  <span>Atualizando {affectedProductsCount} produtos</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">Tudo Certo!</h3>
              <p className="text-sm text-center text-muted-foreground">
                A padronização foi aplicada e os produtos já estão sincronizados.
              </p>
            </div>
          )}

          {status === 'idle' && (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar marcas existentes..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-1 min-h-0 border rounded-md">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {filteredBrands.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma marca encontrada.</p>
                    ) : (
                      filteredBrands.map(brand => (
                        <div 
                          key={brand.name} 
                          className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ${selectedBrands.has(brand.name) ? 'bg-primary/5' : ''}`}
                          onClick={() => toggleBrand(brand.name)}
                        >
                          <Checkbox 
                            id={`brand-${brand.name}`} 
                            checked={selectedBrands.has(brand.name)}
                            onCheckedChange={() => toggleBrand(brand.name)}
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <label 
                              htmlFor={`brand-${brand.name}`} 
                              className="text-sm font-medium leading-none cursor-pointer"
                              onClick={(e) => e.preventDefault()}
                            >
                              {brand.name}
                            </label>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {brand.count} item{brand.count !== 1 && 's'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="bg-muted/30 p-4 rounded-md border space-y-3">
                <div>
                  <label className="text-sm font-medium">Substituir as {selectedBrands.size} marcas selecionadas por:</label>
                  <p className="text-xs text-muted-foreground">Isso alterará {affectedProductsCount} produto(s) permanentemente.</p>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ex: 3-RHO" 
                    value={newBrandName}
                    onChange={e => setNewBrandName(e.target.value)}
                    className="uppercase"
                  />
                  <Button onClick={handleApply} disabled={selectedBrands.size === 0 || !newBrandName.trim()}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
