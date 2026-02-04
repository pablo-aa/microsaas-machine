import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export const KpiCard = ({ title, value, className }: KpiCardProps) => {
  return (
    <Card className={cn("p-6 border border-border rounded-lg bg-card", className)}>
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
    </Card>
  );
};
