
'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from './ui/button';
import type { Product } from '@/lib/types';
import { useAppStore } from '@/store/app-store';

interface ProductSearchProps {
  value: string | undefined;
  onProductSelect: (product: Product) => void;
  onInputChange: (value: string) => void;
  onAddNewProduct: () => void;
}

export default function ProductSearch({
  value,
  onProductSelect,
  onInputChange,
  onAddNewProduct,
}: ProductSearchProps) {
  const { products } = useAppStore();
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  
  // O estado do input de busca é gerenciado internamente pelo CommandInput,
  // mas podemos usar o `value` recebido para controlar o que é exibido no Input principal.

  const filteredProducts = useMemo(() => {
    if (!value) return [];
    
    const lowercasedTerm = value.toLowerCase();
    
    // A lógica de busca padronizada e correta
    return products.filter(product => {
        const productCode = product.codigo || '';
        const productDesc = product.descricao || '';
        const productBrand = product.marca || '';
        const productRef = product.referencia || '';

        return productCode.toLowerCase().includes(lowercasedTerm) ||
               productDesc.toLowerCase().includes(lowercasedTerm) ||
               productBrand.toLowerCase().includes(lowercasedTerm) ||
               productRef.toLowerCase().includes(lowercasedTerm);
    }).slice(0, 10);
  }, [products, value]);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Input
            value={value}
            autoComplete="off"
            onChange={(e) => {
              onInputChange(e.target.value);
              if (e.target.value) {
                setPopoverOpen(true);
              } else {
                setPopoverOpen(false);
              }
            }}
            placeholder="Digite o código ou descrição do produto"
          />
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar produto..."
            value={value}
            onValueChange={(search) => {
                onInputChange(search);
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className='p-4 text-sm text-center'>
                <p>Nenhum produto encontrado.</p>
                <Button variant="link" type="button" onClick={() => {
                    onAddNewProduct();
                    setPopoverOpen(false);
                }}>
                    Cadastrar Novo Produto
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.codigo}-${product.descricao}`}
                  onSelect={() => {
                    onProductSelect(product);
                    setPopoverOpen(false);
                  }}
                >
                  {product.codigo} - {product.descricao}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

