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
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = keyof DailyMetrics;
type SortOrder = "asc" | "desc" | null;

interface MetricsTableProps {
  data: DailyMetrics[];
}

export const MetricsTable = ({ data }: MetricsTableProps) => {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const itemsPerPage = 10;

  const aggregatedData = useMemo(() => {
    return aggregateData(data, granularity);
  }, [data, granularity]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4 ml-1 inline" />;
    if (sortOrder === "desc") return <ArrowDown className="h-4 w-4 ml-1 inline" />;
    return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
  };

  const sortedData = useMemo(() => {
    if (!sortField || !sortOrder) return aggregatedData;
    
    return [...aggregatedData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return 0;
    });
  }, [aggregatedData, sortField, sortOrder]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    
    return sortedData.filter((row) => {
      const searchLower = searchTerm.toLowerCase();
      const dateStr = formatDateByGranularity(row.date, granularity).toLowerCase();
      const revenue = row.revenue.toFixed(2);
      const adSpend = row.adSpend.toFixed(2);
      const roas = row.roas.toFixed(2);
      
      return (
        dateStr.includes(searchLower) ||
        revenue.includes(searchLower) ||
        adSpend.includes(searchLower) ||
        roas.includes(searchLower) ||
        row.formsSubmitted.toString().includes(searchLower) ||
        row.paymentStarted.toString().includes(searchLower) ||
        row.paymentApproved.toString().includes(searchLower)
      );
    });
  }, [sortedData, searchTerm, granularity]);

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
                placeholder="Buscar..."
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
                <TableHead 
                  className="text-foreground font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  Data {getSortIcon("date")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("revenue")}
                >
                  Receita {getSortIcon("revenue")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("adSpend")}
                >
                  Gasto Anúncios {getSortIcon("adSpend")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("roas")}
                >
                  ROAS {getSortIcon("roas")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("formsSubmitted")}
                >
                  Formulários {getSortIcon("formsSubmitted")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("paymentStarted")}
                >
                  Iniciados {getSortIcon("paymentStarted")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("paymentApproved")}
                >
                  Aprovados {getSortIcon("paymentApproved")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("conversionFormToStart")}
                >
                  Conv. F→I {getSortIcon("conversionFormToStart")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("conversionStartToApproved")}
                >
                  Conv. I→A {getSortIcon("conversionStartToApproved")}
                </TableHead>
                <TableHead 
                  className="text-foreground font-semibold text-right cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort("conversionFormToApproved")}
                >
                  Conv. F→A {getSortIcon("conversionFormToApproved")}
                </TableHead>
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
                    <TableCell className="text-right font-mono text-sm">R${row.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">R${row.adSpend.toFixed(2)}</TableCell>
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
