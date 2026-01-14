import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Subscriber {
  id: string;
  session_id: string;
  name: string;
  email: string;
  age: number | null;
  test_link: string | null;
  coupon_code: string | null;
  email_campaign: string | null;
  payment_amount: number;
  original_amount: number;
  payment_date: string;
  test_created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SubscribersProps {
  onLogout?: () => void;
}

const Subscribers = ({ onLogout }: SubscribersProps) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [averageAge, setAverageAge] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Fetch subscribers from Edge Function
  const fetchSubscribers = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      setError(null);

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-subscribers?page=${page}&limit=${pagination.limit}${searchParam}`,
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
        throw new Error(errorData.error || "Erro ao carregar assinantes");
      }

      const data = await response.json();
      setSubscribers(data.data || []);
      setPagination(data.pagination);
      setAverageAge(data.averageAge || null);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar assinantes");
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSubscribers(1, searchTerm);
    }, searchTerm ? 500 : 0); // 500ms debounce when typing, immediate when clearing

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSubscribers(newPage, searchTerm);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLogout={onLogout} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Assinantes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Lista de todos os assinantes que completaram o pagamento
                {averageAge !== null && (
                  <span className="ml-2 text-primary font-medium">
                    • Idade média: {averageAge} anos
                  </span>
                )}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Total: {pagination.total} assinantes
            </Badge>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, cupom ou campanha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">
              Carregando assinantes...
            </span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
            <Card className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Link do Teste</TableHead>
                      <TableHead>Cupom</TableHead>
                      <TableHead>Campanha de Email</TableHead>
                      <TableHead>Valor Pago</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          {searchTerm
                            ? "Nenhum assinante encontrado com este critério"
                            : "Nenhum assinante encontrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {subscriber.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {subscriber.email}
                          </TableCell>
                          <TableCell>
                            {subscriber.age ? `${subscriber.age} anos` : "-"}
                          </TableCell>
                          <TableCell>
                            {subscriber.test_link ? (
                              <a
                                href={subscriber.test_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver Teste
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {subscriber.coupon_code ? (
                              <Badge variant="secondary" className="font-mono">
                                {subscriber.coupon_code}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {subscriber.email_campaign ? (
                              <Badge variant="outline">
                                {subscriber.email_campaign}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">
                            {subscriber.original_amount > subscriber.payment_amount ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground line-through">
                                  R$ {subscriber.original_amount.toFixed(2)}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  R$ {subscriber.payment_amount.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span>R$ {subscriber.payment_amount.toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(subscriber.payment_date)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Subscribers;

