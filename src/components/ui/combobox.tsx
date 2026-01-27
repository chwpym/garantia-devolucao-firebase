"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { normalizeText } from "@/lib/search-utils"

interface ComboboxProps {
  options: { value: string; label: string; keywords?: string[] }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  onAddClick?: () => void;
  addLabel?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  notFoundMessage,
  className,
  onAddClick,
  addLabel
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between font-normal bg-background", className)}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder ?? "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(value, search, keywords) => {
            const normalizedSearch = normalizeText(search);
            const normalizedValue = normalizeText(value);
            const normalizedKeywords = (keywords || []).map(k => normalizeText(k));

            if (normalizedValue.includes(normalizedSearch)) return 1;
            if (normalizedKeywords.some(k => k.includes(normalizedSearch))) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder ?? "Search..."} />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 px-4 text-sm flex flex-col gap-2 items-center">
                <span>{notFoundMessage ?? "Nenhum resultado encontrado."}</span>
                {onAddClick && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      onAddClick();
                      setOpen(false);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {addLabel ?? "Adicionar Novo"}
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label, ...(option.keywords || [])]}
                  onSelect={(currentValue) => {
                    const selectedOption = options.find(opt => opt.value.toLowerCase() === currentValue.toLowerCase());
                    const finalValue = selectedOption ? selectedOption.value : "";
                    onChange(finalValue === value ? "" : finalValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {onAddClick && options.length > 0 && (
              <div className="p-1 border-t mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddClick();
                    setOpen(false);
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  {addLabel ?? "Adicionar Novo"}
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
