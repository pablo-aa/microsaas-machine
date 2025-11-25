import { useState, useMemo } from "react";
import { DailyMetrics, Granularity } from "@/types/metrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aggregateData, formatDateByGranularity } from "@/utils/dataAggregation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface MetricsTableProps {
  data: DailyMetrics[];
}

export const MetricsTable = ({ data }: MetricsTableProps) => {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const aggregatedData = useMemo(() => {
    return aggregateData(data, granularity);
  }, [data, granularity]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return aggregatedData;
    return aggregatedData.filter((row) => {
      const dateStr = formatDateByGranularity(row.date, granularity).toLowerCase();
      return dateStr.includes(searchTerm.toLowerCase());
    });
  }, [aggregatedData, searchTerm, granularity]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const showGranularitySelector = data.length > 14;

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-foreground">Métricas Detalhadas</h3>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {showGranularitySelector && (
              <Select value={granularity} onValueChange={(value) => {
                setGranularity(value as Granularity);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Por dia</SelectItem>
                  <SelectItem value="week">Por semana</SelectItem>
                  <SelectItem value="month">Por mês</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por data..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-foreground font-semibold">Data</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Receita</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Gasto Anúncios</TableHead>
                <TableHead className="text-foreground font-semibold text-right">ROAS</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Formulários</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Iniciados</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Aprovados</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Conv. F→I</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Conv. I→A</TableHead>
                <TableHead className="text-foreground font-semibold text-right">Conv. F→A</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhum resultado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.date} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {formatDateByGranularity(row.date, granularity)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">${row.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">${row.adSpend.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{row.roas.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Math.round(row.formsSubmitted)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Math.round(row.paymentStarted)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Math.round(row.paymentApproved)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{row.conversionFormToStart.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-mono text-sm">{row.conversionStartToApproved.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-mono text-sm">{row.conversionFormToApproved.toFixed(2)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length} resultados
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
