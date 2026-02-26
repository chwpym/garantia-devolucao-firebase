'use client';

import { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { smartSearch } from '@/lib/search-utils';
import type { Product } from '@/lib/types';

interface ComboboxProductProps {
  value: string | undefined;
  onProductSelect: (product: Product) => void;
  onInputChange: (value: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  addEntityLabel?: string;
}

export default function ComboboxProduct({
  value,
  onProductSelect,
  onInputChange,
  onAddNew,
  placeholder = "Aguardando...",
  searchPlaceholder = "Buscar produto por código ou descrição...",
  addEntityLabel = "Cadastrar Novo Produto"
}: ComboboxProductProps) {
  const { products } = useAppStore();
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(value || '');

  // Debounce mechanism to prevent UI flickering on every keystroke
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(value || '');
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [value]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) {
      // If empty, show recent or top products instead of nothing
      return products.slice(0, 10);
    }

    return products
      .filter(p => smartSearch(p, debouncedSearchTerm, ['codigo', 'descricao', 'referencia', 'marca']))
      .slice(0, 15); // Hard limit to prevent DOM massive rendering lag
  }, [products, debouncedSearchTerm]);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <div className="flex gap-2 w-full">
            <Input
              value={value}
              autoComplete="off"
              onChange={(e) => {
                onInputChange(e.target.value);
                setPopoverOpen(true);
              }}
              onFocus={() => {
                setPopoverOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Tab') {
                  setPopoverOpen(true);
                }
              }}
              placeholder={placeholder}
              className="flex-1"
            />
            {onAddNew && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={(e) => {
                        e.preventDefault();
                        setPopoverOpen(false);
                        onAddNew();
                    }}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            )}
          </div>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={value}
            onValueChange={(search) => {
                onInputChange(search);
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className='p-4 text-sm text-center flex flex-col items-center gap-2'>
                <p>Nenhum produto encontrado...</p>
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
