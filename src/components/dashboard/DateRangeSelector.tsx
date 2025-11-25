import { DateRange, CustomDateRange } from "@/types/metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface DateRangeSelectorProps {
  selected: DateRange;
  onChange: (range: DateRange) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range: CustomDateRange) => void;
}

export const DateRangeSelector = ({ 
  selected, 
  onChange, 
  customRange,
  onCustomRangeChange
}: DateRangeSelectorProps) => {
  const ranges: { value: DateRange; label: string }[] = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "7", label: "Últimos 7 dias" },
    { value: "14", label: "Últimos 14 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "all", label: "Histórico" },
  ];

  const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
    if (!value) return;
    
    const newDate = new Date(value);
    if (type === 'from') {
      const to = customRange?.to || new Date();
      onCustomRangeChange?.({ from: newDate, to });
    } else {
      const from = customRange?.from || new Date();
      onCustomRangeChange?.({ from, to: newDate });
    }
    onChange("custom");
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selected === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range.value)}
          className={cn(
            "transition-colors",
            selected === range.value && "bg-primary text-primary-foreground"
          )}
        >
          {range.label}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={selected === "custom" ? "default" : "outline"}
            size="sm"
            className={cn(
              "transition-colors",
              selected === "custom" && "bg-primary text-primary-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {customRange?.from && customRange?.to ? (
              <>
                {customRange.from.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {customRange.to.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </>
            ) : (
              "Personalizado"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data inicial</label>
              <Input
                type="date"
                value={formatDateForInput(customRange?.from)}
                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data final</label>
              <Input
                type="date"
                value={formatDateForInput(customRange?.to)}
                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
