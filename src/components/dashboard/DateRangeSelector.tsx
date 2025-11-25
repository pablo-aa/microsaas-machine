import { DateRange } from "@/types/metrics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangeSelectorProps {
  selected: DateRange;
  onChange: (range: DateRange) => void;
}

export const DateRangeSelector = ({ selected, onChange }: DateRangeSelectorProps) => {
  const ranges: { value: DateRange; label: string }[] = [
    { value: "7", label: "Last 7 days" },
    { value: "14", label: "Last 14 days" },
    { value: "30", label: "Last 30 days" },
  ];

  return (
    <div className="flex gap-2">
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
    </div>
  );
};
