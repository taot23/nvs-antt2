import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ onChange, className }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [presetOption, setPresetOption] = useState<string>("30d");

  useEffect(() => {
    onChange(date);
  }, [date, onChange]);

  // Função para definir os intervalos predefinidos
  const handlePresetChange = (value: string) => {
    const today = new Date();
    
    let newRange: DateRange | undefined;
    
    switch (value) {
      case "7d":
        newRange = {
          from: subDays(today, 7),
          to: today,
        };
        break;
      case "30d":
        newRange = {
          from: subDays(today, 30),
          to: today,
        };
        break;
      case "90d":
        newRange = {
          from: subDays(today, 90),
          to: today,
        };
        break;
      case "currentMonth":
        newRange = {
          from: startOfMonth(today),
          to: today,
        };
        break;
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(today), 1);
        newRange = {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
        break;
      default:
        newRange = date;
    }
    
    setPresetOption(value);
    setDate(newRange);
    onChange(newRange);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Select value={presetOption} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="currentMonth">Mês atual</SelectItem>
            <SelectItem value="lastMonth">Mês anterior</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}