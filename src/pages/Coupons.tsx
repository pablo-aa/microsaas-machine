import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Search, Link as LinkIcon, FileText, Copy, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface CouponsProps {
  onLogout?: () => void;
}

const Coupons = ({ onLogout }: CouponsProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Tools states
  const [selectedCouponForLink, setSelectedCouponForLink] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [testId, setTestId] = useState<string>("");
  const [selectedCouponForTest, setSelectedCouponForTest] = useState<string>("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: 0,
    description: "",
    is_active: true,
    expires_at: "",
    max_uses: "",
  });

  // Fetch coupons from Edge Function
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-coupons`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao carregar cupons");
      }

      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.code || formData.code.trim().length < 4) {
      return "Código deve ter no mínimo 4 caracteres";
    }

    if (formData.code.trim().length > 50) {
      return "Código deve ter no máximo 50 caracteres";
    }

    if (!/^[A-Z0-9]+$/i.test(formData.code.trim())) {
      return "Código deve conter apenas letras e números";
    }

    if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
      return "Desconto deve estar entre 0% e 100%";
    }

    if (formData.max_uses && parseInt(formData.max_uses) < 1) {
      return "Máximo de usos deve ser maior que 0";
    }

    return null;
  };

  // Handle create
  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-coupons`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          discount_percentage: formData.discount_percentage,
          description: formData.description || null,
          is_active: formData.is_active,
          expires_at: formData.expires_at || null,
          max_uses: formData.max_uses || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao criar cupom");
      }

      setDialogOpen(false);
      resetForm();
      await fetchCoupons();
    } catch (err) {
      console.error("Error creating coupon:", err);
      setError(err instanceof Error ? err.message : "Erro ao criar cupom");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingCoupon) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-coupons?id=${editingCoupon.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discount_percentage: formData.discount_percentage,
            description: formData.description || null,
            is_active: formData.is_active,
            expires_at: formData.expires_at || null,
            max_uses: formData.max_uses || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao atualizar cupom");
      }

      setDialogOpen(false);
      setEditingCoupon(null);
      resetForm();
      await fetchCoupons();
    } catch (err) {
      console.error("Error updating coupon:", err);
      setError(err instanceof Error ? err.message : "Erro ao atualizar cupom");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!couponToDelete) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-coupons?id=${couponToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao excluir cupom");
      }

      setDeleteDialogOpen(false);
      setCouponToDelete(null);
      await fetchCoupons();
    } catch (err) {
      console.error("Error deleting coupon:", err);
      setError(err instanceof Error ? err.message : "Erro ao excluir cupom");
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (coupon: Coupon) => {
    try {
      setError(null);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-coupons?id=${coupon.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !coupon.is_active,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao atualizar status");
      }

      await fetchCoupons();
    } catch (err) {
      console.error("Error toggling active:", err);
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    }
  };

  // Open edit dialog
  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      description: coupon.description || "",
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : "",
      max_uses: coupon.max_uses?.toString() || "",
    });
    setError(null);
    setDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCoupon(null);
    resetForm();
    setError(null);
    setDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      discount_percentage: 0,
      description: "",
      is_active: true,
      expires_at: "",
      max_uses: "",
    });
    setError(null);
  };

  // Filter coupons by search term
  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toUpperCase().includes(searchTerm.toUpperCase())
  );

  // Generate payment link with coupon
  const generateLink = () => {
    if (!selectedCouponForLink) return;
    
    const baseUrl = "https://www.qualcarreira.com";
    const link = `${baseUrl}/?cupom=${selectedCouponForLink}`;
    setGeneratedLink(link);
  };

  // Copy link to clipboard
  const copyLink = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Extract ID from URL or use raw ID
  const extractTestId = (input: string): string => {
    // Remove espaços
    const cleaned = input.trim();
    
    // Se for URL completa, extrair ID
    // Patterns: /resultado/{id}, /resultado/{id}/, https://...resultado/{id}
    const urlMatch = cleaned.match(/\/resultado\/([a-f0-9-]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Se for só o ID (UUID format)
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (uuidPattern.test(cleaned)) {
      return cleaned;
    }
    
    // Tentar extrair UUID de qualquer lugar do texto
    const uuidMatch = cleaned.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
      return uuidMatch[1];
    }
    
    return cleaned; // Retorna como está se não conseguir extrair
  };

  // Apply discount to existing test
  const applyDiscountToTest = async () => {
    if (!testId || !selectedCouponForTest) {
      setError("Preencha o ID do teste e selecione um cupom");
      return;
    }

    const extractedId = extractTestId(testId);
    
    if (!extractedId) {
      setError("ID inválido. Cole a URL completa ou o ID do teste.");
      return;
    }

    try {
      setApplyingDiscount(true);
      setError(null);
      setDiscountSuccess(null);

      // Call Edge Function to apply retroactive discount
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/apply-retroactive-discount`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            test_id: extractedId,
            coupon_code: selectedCouponForTest,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao aplicar desconto");
      }

      const data = await response.json();
      
      setDiscountSuccess(
        `${data.message} Valor original: R$${data.original_amount.toFixed(2)} → Novo valor: R$${data.final_amount.toFixed(2)}`
      );
      setTestId("");
      setSelectedCouponForTest("");
      
      // Refresh coupons to update usage count
      await fetchCoupons();
      
      setTimeout(() => setDiscountSuccess(null), 8000);
    } catch (err) {
      console.error("Error applying discount:", err);
      setError(err instanceof Error ? err.message : "Erro ao aplicar desconto");
    } finally {
      setApplyingDiscount(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      case "expirado":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Expirado</Badge>;
      case "esgotado":
        return <Badge variant="destructive">Esgotado</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
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
              <h1 className="text-3xl font-bold text-foreground">Cupons de Desconto</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie os cupons de desconto do sistema
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código..."
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
            <span className="ml-3 text-lg text-muted-foreground">Carregando cupons...</span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchTerm
                        ? "Nenhum cupom encontrado com este código"
                        : "Nenhum cupom cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                      <TableCell>{coupon.discount_percentage}%</TableCell>
                      <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                      <TableCell>
                        {coupon.current_uses}/{coupon.max_uses || "∞"}
                      </TableCell>
                      <TableCell>
                        {coupon.expires_at
                          ? format(new Date(coupon.expires_at), "dd/MM/yyyy")
                          : "Sem limite"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {coupon.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(coupon)}
                          >
                            {coupon.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(coupon)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: AMIGO50"
                  disabled={!!editingCoupon}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {editingCoupon
                    ? "Código não pode ser editado"
                    : "Apenas letras e números, 4-50 caracteres"}
                </p>
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%) *</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percentage: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do cupom"
                  rows={3}
                />
              </div>

              {/* Active */}
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Ativo</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              {/* Expires At */}
              <div className="space-y-2">
                <Label htmlFor="expires_at">Data de Expiração</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Deixe vazio para sem limite</p>
              </div>

              {/* Max Uses */}
              <div className="space-y-2">
                <Label htmlFor="max_uses">Máximo de Usos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                />
                <p className="text-xs text-muted-foreground">Deixe vazio para ilimitado</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={editingCoupon ? handleUpdate : handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingCoupon ? (
                  "Atualizar"
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o cupom <strong>{couponToDelete?.code}</strong>?
                {couponToDelete && couponToDelete.current_uses > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Atenção: Este cupom já foi usado {couponToDelete.current_uses} vez(es).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={submitting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin Tools Section */}
        {!loading && coupons.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ferramentas Admin</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tool 1: Generate Link with Discount */}
              <Card className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">Criar Link com Desconto</h3>
                    <p className="text-sm text-muted-foreground">
                      Gere um link de pagamento com cupom já aplicado
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="coupon-select">Selecione o Cupom</Label>
                    <select
                      id="coupon-select"
                      value={selectedCouponForLink}
                      onChange={(e) => {
                        setSelectedCouponForLink(e.target.value);
                        setGeneratedLink("");
                        setLinkCopied(false);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">-- Selecione um cupom --</option>
                      {coupons
                        .filter(c => c.is_active)
                        .map(coupon => (
                          <option key={coupon.id} value={coupon.code}>
                            {coupon.code} - {coupon.discount_percentage}% desconto
                          </option>
                        ))}
                    </select>
                  </div>

                  <Button
                    onClick={generateLink}
                    disabled={!selectedCouponForLink}
                    className="w-full"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Gerar Link
                  </Button>

                  {generatedLink && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={generatedLink}
                          readOnly
                          className="flex-1 font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyLink}
                          className="gap-2"
                        >
                          {linkCopied ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Link com cupom <strong>{selectedCouponForLink}</strong> já aplicado. O desconto será calculado automaticamente no pagamento.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Tool 2: Apply Discount to Existing Test */}
              <Card className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">Aplicar Desconto Retroativo</h3>
                    <p className="text-sm text-muted-foreground">
                      Aplique um cupom a um teste já realizado
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="test-id">URL ou ID do Teste</Label>
                    <Input
                      id="test-id"
                      placeholder="Cole: /resultado/{id} ou o ID completo"
                      value={testId}
                      onChange={(e) => setTestId(e.target.value)}
                      className="text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aceita: URL completa, /resultado/id, ou apenas o UUID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coupon-select-test">Selecione o Cupom</Label>
                    <select
                      id="coupon-select-test"
                      value={selectedCouponForTest}
                      onChange={(e) => setSelectedCouponForTest(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">-- Selecione um cupom --</option>
                      {coupons
                        .filter(c => c.is_active)
                        .map(coupon => (
                          <option key={coupon.id} value={coupon.code}>
                            {coupon.code} - {coupon.discount_percentage}% desconto
                          </option>
                        ))}
                    </select>
                  </div>

                  <Button
                    onClick={applyDiscountToTest}
                    disabled={!testId || !selectedCouponForTest || applyingDiscount}
                    className="w-full"
                  >
                    {applyingDiscount ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aplicar Desconto
                      </>
                    )}
                  </Button>

                  {discountSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {discountSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <p className="text-xs text-muted-foreground">
                    ⚠️ Esta ação irá recalcular o valor do pagamento e incrementar o uso do cupom
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;

