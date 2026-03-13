
'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from './ui/button';
import type { Product } from '@/lib/types';
import { useAppStore } from '@/store/app-store';
import { smartSearch } from '@/lib/search-utils';

interface ComboboxSearchProps {
  value: string | undefined;
  onProductSelect: (product: Product) => void;
  onInputChange: (value: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  addEntityLabel?: string;
}

export default function ComboboxSearch({
  value,
  onProductSelect,
  onInputChange,
  onAddNew,
  placeholder = "Digite para buscar...",
  searchPlaceholder = "Buscar...",
  addEntityLabel = "Cadastrar Novo"
}: ComboboxSearchProps) {
  const { products } = useAppStore();
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  
  const filteredProducts = useMemo(() => {
    if (!value) return [];
    
    return products.filter(product => 
        smartSearch(product, value, ['codigo', 'descricao', 'marca', 'referencia'])
    ).slice(0, 15);
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
            placeholder={placeholder}
          />
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={value}
            onValueChange={(search) => {
                onInputChange(search);
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className='p-4 text-sm text-center'>
                <p>Nenhum resultado encontrado.</p>
                <Button variant="link" type="button" onClick={() => {
                    onAddNew();
                    setPopoverOpen(false);
                }}>
                    {addEntityLabel}
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
