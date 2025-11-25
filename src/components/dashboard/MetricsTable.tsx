import { DailyMetrics } from "@/types/metrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface MetricsTableProps {
  data: DailyMetrics[];
}

export const MetricsTable = ({ data }: MetricsTableProps) => {
  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Daily Metrics</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-foreground font-semibold">Date</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Revenue</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Ad Spend</TableHead>
              <TableHead className="text-foreground font-semibold text-right">ROAS</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Forms</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Started</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Approved</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Conv. F→S</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Conv. S→A</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Conv. F→A</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.date} className="border-b border-border hover:bg-accent/50 transition-colors">
                <TableCell className="font-medium font-mono text-sm">
                  {new Date(row.date).toLocaleDateString("en-US", { 
                    month: "short", 
                    day: "numeric",
                    year: "numeric"
                  })}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">${row.revenue.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono text-sm">${row.adSpend.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.roas.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.formsSubmitted}</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.paymentStarted}</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.paymentApproved}</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.conversionFormToStart.toFixed(2)}%</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.conversionStartToApproved.toFixed(2)}%</TableCell>
                <TableCell className="text-right font-mono text-sm">{row.conversionFormToApproved.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
