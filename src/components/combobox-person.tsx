'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from './ui/button';
import { useAppStore } from '@/store/app-store';

interface PersonOption {
  value: string;
  label: string;
  key: string;
  keywords?: string[];
}

interface ComboboxPersonProps {
  value: string | undefined;
  options: PersonOption[];
  onPersonSelect: (personName: string) => void;
  onInputChange: (value: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  addEntityLabel?: string;
}

export default function ComboboxPerson({
  value,
  options,
  onPersonSelect,
  onInputChange,
  onAddNew,
  placeholder = "Digite para buscar...",
  searchPlaceholder = "Buscar...",
  addEntityLabel = "Cadastrar Novo"
}: ComboboxPersonProps) {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  
  const filteredOptions = useMemo(() => {
    if (!value) return options.slice(0, 15);
    
    const lowercasedTerm = value.toLowerCase();
    
    return options.filter(option => {
        const matchesLabel = option.label.toLowerCase().includes(lowercasedTerm);
        const matchesKeywords = option.keywords?.some(k => k.toLowerCase().includes(lowercasedTerm));
        return matchesLabel || matchesKeywords;
    }).slice(0, 15);
  }, [options, value]);

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
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.key}
                  value={option.label}
                  onSelect={() => {
                    onPersonSelect(option.label);
                    setPopoverOpen(false);
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {onAddNew && options.length > 0 && (
              <div className="p-1 border-t mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddNew();
                    setPopoverOpen(false);
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  {addEntityLabel}
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
