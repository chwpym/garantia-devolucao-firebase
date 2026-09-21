"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
}

const dateToInputValue = (d?: Date) => d && isValid(d) ? format(d, 'yyyy-MM-dd') : "";

const inputValueToDate = (val: string) => {
  if (!val) return undefined;
  const parsed = new Date(val + 'T12:00:00'); 
  return isValid(parsed) ? parsed : undefined;
}

export function DatePickerWithRange({
  className,
  date,
  setDate
}: DatePickerWithRangeProps) {
  
  const [error, setError] = React.useState<string | null>(null);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = inputValueToDate(e.target.value);
    validateAndSet(newFrom, date?.to);
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = inputValueToDate(e.target.value);
    validateAndSet(date?.from, newTo);
  }

  const validateAndSet = (from?: Date, to?: Date) => {
    if (from && to && from > to) {
      setError("Data inválida. Final menor que inicial.");
      setDate({ from, to });
    } else {
      setError(null);
      setDate({ from, to });
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <input 
          type="date" 
          value={dateToInputValue(date?.from)}
          onChange={handleFromChange}
          className="flex h-10 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Data Inicial"
          title="Data Inicial"
        />
        <span className="hidden sm:inline text-muted-foreground">-</span>
        <input 
          type="date" 
          value={dateToInputValue(date?.to)}
          onChange={handleToChange}
          className="flex h-10 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Data Final"
          title="Data Final"
        />
      </div>
      {error && (
        <span className="text-xs text-destructive font-medium">{error}</span>
      )}
    </div>
  )
}
