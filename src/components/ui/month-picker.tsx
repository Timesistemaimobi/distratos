"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthPickerProps {
  value: string; // formato "YYYY-MM"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MonthPicker({ value, onChange, placeholder = "Selecione um mês", className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Extract year and month from value, or use current date
  const initialDate = value ? parse(value, "yyyy-MM", new Date()) : new Date();
  const [currentYear, setCurrentYear] = React.useState(initialDate.getFullYear());

  // Update internal year state if value changes externally
  React.useEffect(() => {
    if (value) {
      setCurrentYear(parse(value, "yyyy-MM", new Date()).getFullYear());
    }
  }, [value]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1);
    return {
      value: i,
      label: format(date, "MMM", { locale: ptBR }),
    };
  });

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    onChange(format(newDate, "yyyy-MM"));
    setOpen(false);
  };

  const handlePreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const selectedDate = value ? parse(value, "yyyy-MM", new Date()) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal rounded-xl h-12 bg-white/50 dark:bg-zinc-900/50 border-zinc-200",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
          {selectedDate ? (
            <span className="capitalize">{format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4 rounded-2xl" align="start">
        <div className="flex items-center justify-between space-x-2 pb-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
            onClick={handlePreviousYear}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold text-sm">
            {currentYear}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
            onClick={handleNextYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month) => {
            const isSelected = selectedDate?.getFullYear() === currentYear && selectedDate?.getMonth() === month.value;
            return (
              <Button
                key={month.value}
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "h-10 capitalize rounded-xl font-medium",
                  isSelected && "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                )}
                onClick={() => handleMonthSelect(month.value)}
              >
                {month.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
