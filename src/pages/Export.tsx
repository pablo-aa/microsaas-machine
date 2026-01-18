import { useState, useMemo } from "react";
import { format, startOfDay, subDays } from "date-fns";
import JSZip from "jszip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { DateRange, CustomDateRange } from "@/types/metrics";
import { Loader2, Download, FileArchive } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface UserExportData {
  name: string;
  email: string;
  age: number | null;
  hasPaid: boolean;
  purchaseDate: string | null;
  amountPaid: number | null;
  usedCoupon: boolean;
  couponCode: string | null;
}

interface ExportProps {
  onLogout?: () => void;
}

const Export = ({ onLogout }: ExportProps) => {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();
  const [dateField, setDateField] = useState<"test_created_at" | "purchase_date">("test_created_at");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Calculate date range for API call
  const { startDate, endDate } = useMemo(() => {
    // Se "all", não passar filtros de data
    if (dateRange === "all") {
      return { startDate: null, endDate: null };
    }

    // Calculate today in GMT-3 (Brazil timezone)
    const now = new Date();
    const brazilOffset = -3 * 60; // GMT-3 in minutes
    const brazilTime = new Date(now.getTime() + (now.getTimezoneOffset() + brazilOffset) * 60000);
    const today = startOfDay(brazilTime);
    
    switch (dateRange) {
      case "today": {
        const todayStr = format(today, 'yyyy-MM-dd');
        return { startDate: todayStr, endDate: todayStr };
      }
      case "yesterday": {
        const yesterday = subDays(today, 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        return { startDate: yesterdayStr, endDate: yesterdayStr };
      }
      case "custom": {
        if (!customRange) {
          return { startDate: null, endDate: null };
        }
        return {
          startDate: format(startOfDay(customRange.from), 'yyyy-MM-dd'),
          endDate: format(startOfDay(customRange.to), 'yyyy-MM-dd'),
        };
      }
      default: {
        const days = parseInt(dateRange);
        const start = subDays(today, days - 1);
        return { 
          startDate: format(start, 'yyyy-MM-dd'), 
          endDate: format(today, 'yyyy-MM-dd')
        };
      }
    }
  }, [dateRange, customRange]);

  // Convert to CSV
  const convertToCSV = (data: UserExportData[]): string => {
    const headers = [
      "Nome",
      "Email",
      "Idade",
      "Pagou",
      "Data da compra",
      "Valor pago",
      "Usou cupom",
      "Código cupom",
    ];

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Se contém vírgula, aspas ou quebra de linha, envolver em aspas duplas
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = data.map((user) => [
      escapeCSV(user.name),
      escapeCSV(user.email),
      escapeCSV(user.age),
      escapeCSV(user.hasPaid ? "Sim" : "Não"),
      escapeCSV(user.purchaseDate || ""),
      escapeCSV(user.amountPaid ? user.amountPaid.toFixed(2) : ""),
      escapeCSV(user.usedCoupon ? "Sim" : "Não"),
      escapeCSV(user.couponCode),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Adicionar BOM UTF-8 para Excel
    return "\uFEFF" + csvContent;
  };

  // Fetch users with cursor pagination
  const fetchUsersPage = async (
    cursor: string | null, 
    limit: number,
    startDate: string | null,
    endDate: string | null,
    dateField: string
  ): Promise<{
    data: UserExportData[];
    nextCursor: string | null;
    hasMore: boolean;
  }> => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (cursor) {
      params.append("cursor", cursor);
    }
    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }
    params.append("dateField", dateField);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-all-users?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao carregar dados");
    }

    const result = await response.json();
    return {
      data: result.data || [],
      nextCursor: result.pagination?.nextCursor || null,
      hasMore: result.pagination?.hasMore || false,
    };
  };

  // Create ZIP file
  const createZipFile = async (csvContent: string, jsonContent: string, timestamp: string): Promise<Blob> => {
    const zip = new JSZip();
    
    zip.file(`users_export_${timestamp}.csv`, csvContent);
    zip.file(`users_export_${timestamp}.json`, jsonContent);
    
    return await zip.generateAsync({ type: 'blob' });
  };

  // Handle export
  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setProgress("Iniciando exportação...");

      const allUsers: UserExportData[] = [];
      let cursor: string | null = null;
      let hasMore = true;
      const limit = 1000;

      // Loop de chamadas paginadas
      console.log("[Export] Starting export with filters:", { startDate, endDate, dateField });
      
      while (hasMore) {
        setProgress(`Carregando... ${allUsers.length} registros processados`);

        const result = await fetchUsersPage(
          cursor, 
          limit, 
          startDate, 
          endDate, 
          dateField
        );
        
        console.log("[Export] Fetched page:", { 
          count: result.data.length, 
          hasMore: result.hasMore, 
          nextCursor: result.nextCursor,
          sampleDates: result.data.slice(0, 3).map((u: any) => u.purchaseDate || "N/A")
        });
        
        // Adicionar resultados ao array
        allUsers.push(...result.data);

        // Atualizar cursor e hasMore
        cursor = result.nextCursor;
        hasMore = result.hasMore;

        // Se não há mais dados, parar
        if (result.data.length === 0) {
          hasMore = false;
        }

        // Proteção: se estamos pegando muitos registros e temos filtros de data, algo está errado
        if (startDate && endDate && allUsers.length > 50000) {
          console.error("[Export] WARNING: Too many records for date range, stopping to prevent infinite loop");
          setError("Muitos registros encontrados. Verifique se os filtros de data estão corretos.");
          break;
        }
      }

      setProgress(`Processando ${allUsers.length} registros...`);

      // Gerar CSV e JSON
      const csvContent = convertToCSV(allUsers);
      const jsonContent = JSON.stringify(allUsers, null, 2);

      // Nome do arquivo com timestamp
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");

      // Criar ZIP
      setProgress("Criando arquivo ZIP...");
      const zipBlob = await createZipFile(csvContent, jsonContent, timestamp);

      // Download ZIP
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipLink = document.createElement("a");
      zipLink.href = zipUrl;
      zipLink.download = `users_export_${timestamp}.zip`;
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);
      URL.revokeObjectURL(zipUrl);

      setProgress(`Exportação concluída! ${allUsers.length} registros exportados.`);
      
      // Limpar progresso após 3 segundos
      setTimeout(() => {
        setProgress("");
        setExporting(false);
      }, 3000);

    } catch (err) {
      console.error("Error exporting:", err);
      setError(err instanceof Error ? err.message : "Erro ao exportar dados");
      setExporting(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLogout={onLogout} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exportar Dados</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Exporte usuários que fizeram o teste em CSV e JSON (arquivo ZIP)
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Export Options */}
        <Card className="p-6">
          <div className="flex flex-col gap-6">
            {/* Date Range Selector */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Selecione o período:</Label>
              <DateRangeSelector
                selected={dateRange}
                onChange={setDateRange}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />
              <p className="text-xs text-muted-foreground">
                {dateRange === "all" 
                  ? "Exportará todos os usuários (período completo)"
                  : startDate && endDate
                  ? `Exportará usuários de ${startDate} até ${endDate}`
                  : "Selecione um período"}
              </p>
            </div>

            {/* Date Field Selector - Hidden, sempre usa test_created_at */}
            {/* Mantido como test_created_at por padrão, sem opção de mudar */}

            {/* Progress */}
            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progress}</span>
              </div>
            )}

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={exporting}
              size="lg"
              className="w-full sm:w-auto"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4 mr-2" />
                  Exportar (ZIP)
                </>
              )}
            </Button>

            {/* Info */}
            <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
              <p>
                <strong>Arquivo ZIP:</strong> Contém CSV e JSON com todos os dados exportados
              </p>
              <p>
                <strong>CSV:</strong> Compatível com Excel, inclui todos os dados formatados
              </p>
              <p>
                <strong>JSON:</strong> Formato estruturado para uso em outras aplicações
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Export;
