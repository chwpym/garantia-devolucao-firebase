import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPhoneNumber(value: string): string {
  if (!value) return '';
  
  const cleaned = value.replace(/\D/g, '');
  const isCelular = cleaned.length === 11;
  
  if (cleaned.length <= 2) {
    return `(${cleaned}`;
  }
  
  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  
  if (isCelular) {
    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  } else { // Fixo ou incompleto
    if (cleaned.length <= 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
    }
     // Handle cases where user types more than 10 digits for a landline (just truncate)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
}
