import React, { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Sparkles,
  MousePointerClick,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { CrossTrafficService, type CrossTrafficPartnership } from "@/modules/deals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AvailablePartner {
  id: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  city?: string | null;
}

export interface CrossTrafficManagerProps {
  bioPageId: string;
  pageTitle?: string;
  className?: string;
}

export function CrossTrafficManager({
  bioPageId,
  pageTitle = "Sua Página",
  className = "",
}: CrossTrafficManagerProps) {
  const [partnerships, setPartnerships] = useState<CrossTrafficPartnership[]>([]);
  const [availablePartners, setAvailablePartners] = useState<AvailablePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [benefitText, setBenefitText] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("Parceiro da Rede");

  const loadData = async () => {
    if (!bioPageId) return;
    setLoading(true);
    try {
      const [parts, available] = await Promise.all([
        CrossTrafficService.getPartnershipsForPage(bioPageId),
        CrossTrafficService.listAvailablePartnerPages(bioPageId),
      ]);
      setPartnerships(parts);
      setAvailablePartners(available);
      if (available.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(available[0].id);
      }
    } catch (err) {
      console.error("[CrossTrafficManager] Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados de parcerias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [bioPageId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      toast.error("Selecione um parceiro da rede.");
      return;
    }
    if (!benefitText.trim()) {
      toast.error("Informe o benefício mútuo da parceria.");
      return;
    }

    setSaving(true);
    try {
      await CrossTrafficService.createPartnership(
        bioPageId,
        selectedPartnerId,
        benefitText.trim(),
        badgeLabel.trim() || "Parceiro da Rede"
      );
      toast.success("Parceria mútua criada com sucesso!");
      setModalOpen(false);
      setBenefitText("");
      await loadData();
    } catch (err: any) {
      console.error("[CrossTrafficManager] Erro ao salvar parceria:", err);
      toast.error(err.message || "Erro ao salvar parceria.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partnershipId: string) => {
    if (!confirm("Deseja realmente remover esta parceria de tráfego cruzado?")) return;

    try {
      await CrossTrafficService.deletePartnership(partnershipId);
      toast.success("Parceria removida com sucesso.");
      setPartnerships((prev) => prev.filter((p) => p.id !== partnershipId));
    } catch (err) {
      console.error("[CrossTrafficManager] Erro ao remover parceria:", err);
      toast.error("Erro ao remover parceria.");
    }
  };

  return (
    <Card className={`rounded-xl border border-border bg-card shadow-xs overflow-hidden ${className}`}>
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Gift className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Tráfego Cruzado & Parcerias
              </p>
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-1">
              Parceiros da Rede ({partnerships.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Troque visitas e clientes com outros comércios locais recomendados. Ambos os perfis ganham destaque mútuo.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Parceria
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-4">
        {loading ? (
          <p className="text-xs text-muted-foreground animate-pulse py-4 text-center">
            Carregando parceiros da rede...
          </p>
        ) : partnerships.length === 0 ? (
          <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Nenhuma parceria ativa vinculada a {pageTitle}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Conecte seu perfil ao de lojas vizinhas ou parceiros estratégicos para multiplicar seu público de forma orgânica.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Selecionar Primeiro Parceiro
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {partnerships.map((partner) => (
              <div
                key={partner.id}
                className="flex items-start justify-between p-3.5 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-card to-transparent text-xs group"
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  {partner.partner_avatar ? (
                    <img
                      src={partner.partner_avatar}
                      alt={partner.partner_name || "Parceiro"}
                      className="h-10 w-10 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {(partner.partner_name || "P").slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground truncate">
                        {partner.partner_name || "Parceiro da Rede"}
                      </p>
                      <span className="text-[10px] text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                        {partner.badge_label}
                      </span>
                    </div>
                    <p className="text-emerald-400 font-medium line-clamp-2">
                      {partner.benefit_text}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {partner.clicks_count || 0} cliques gerados
                      </span>
                      {partner.partner_slug && (
                        <a
                          href={`/p/${partner.partner_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground flex items-center gap-1"
                        >
                          <span>Ver perfil</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(partner.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                  title="Remover parceria"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* MODAL DE SELEÇÃO DE PARCEIRO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-400">
                <Gift className="h-5 w-5" />
                <DialogTitle>Nova Parceria de Tráfego Cruzado</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Selecione uma empresa da rede para criar um intercâmbio de público. A recomendação aparecerá mutuamente no perfil de ambos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Seleção do Parceiro */}
              <div className="space-y-1.5">
                <Label htmlFor="partnerSelect" className="text-xs font-semibold">
                  Selecione a Empresa Parceira da Rede
                </Label>
                {availablePartners.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhuma outra empresa elegível encontrada na rede para pareamento.
                  </p>
                ) : (
                  <select
                    id="partnerSelect"
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                    required
                  >
                    <option value="" disabled>Escolha um parceiro...</option>
                    {availablePartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} {p.city ? `(${p.city})` : ""} — /p/{p.slug}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Texto do Benefício */}
              <div className="space-y-1.5">
                <Label htmlFor="benefitText" className="text-xs font-semibold">
                  Benefício / Cortesia Oferecida aos Clientes
                </Label>
                <Input
                  id="benefitText"
                  value={benefitText}
                  onChange={(e) => setBenefitText(e.target.value)}
                  placeholder="Ex: Apresente este perfil e ganhe 10% de desconto na Loja X"
                  className="text-xs h-10"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Frase clara que estimula o cliente de uma loja a visitar a outra.
                </p>
              </div>

              {/* Rótulo da Etiqueta */}
              <div className="space-y-1.5">
                <Label htmlFor="badgeLabel" className="text-xs font-semibold">
                  Título da Etiqueta (Badge)
                </Label>
                <Input
                  id="badgeLabel"
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                  placeholder="Ex: Parceiro da Rede ou Cortesia Exclusiva"
                  className="text-xs h-9"
                />
              </div>

              {/* Prévia do Card */}
              {selectedPartnerId && benefitText && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Prévia do Card no Perfil
                  </span>
                  <div className="text-foreground font-semibold">
                    {availablePartners.find((p) => p.id === selectedPartnerId)?.display_name}
                  </div>
                  <div className="text-emerald-400 text-xs font-medium">
                    {benefitText}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || availablePartners.length === 0}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {saving ? "Salvando Parceria..." : "Ativar Parceria Mútua"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CrossTrafficManager;
