import { useState } from "react";
import { DateRange, CustomDateRange } from "@/types/metrics";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange as CalendarDateRange } from "react-day-picker";

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
  const [dateRange, setDateRange] = useState<CalendarDateRange | undefined>(
    customRange ? { from: customRange.from, to: customRange.to } : undefined
  );

  const ranges: { value: DateRange; label: string }[] = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "7", label: "Últimos 7 dias" },
    { value: "14", label: "Últimos 14 dias" },
    { value: "30", label: "Últimos 30 dias" },
  ];

  const handleCustomRangeSelect = (range: CalendarDateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to && onCustomRangeChange) {
      onCustomRangeChange({ from: range.from, to: range.to });
      onChange("custom");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
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
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy")
              )
            ) : (
              "Personalizado"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
