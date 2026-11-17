import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  MapPin,
  Star,
  Search,
  Building2,
  Phone,
  ArrowRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
  X,
} from "lucide-react";
import { ProspectingService } from "@/modules/prospecting/ProspectingService";
import type { ProspectedCompany } from "@/modules/prospecting/types";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { toast } from "sonner";

interface GoogleBusinessLeadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLead?: (company: ProspectedCompany) => void;
}

export function GoogleBusinessLeadDrawer({
  open,
  onOpenChange,
  onSelectLead,
}: GoogleBusinessLeadDrawerProps) {
  const [companies, setCompanies] = useState<ProspectedCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    createProject,
    selectProject,
    updateActiveProjectBriefing,
    addChatMessage,
    projects,
  } = useCreativeStudioStore();

  useEffect(() => {
    if (!open) return;
    async function loadLeads() {
      setLoading(true);
      try {
        const list = await ProspectingService.list();
        setCompanies(list);
      } catch (err) {
        console.warn("[GoogleBusinessLeadDrawer] Erro ao listar leads:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadLeads();
  }, [open]);

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.niche && c.niche.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  function handlePickCompany(company: ProspectedCompany) {
    if (onSelectLead) {
      onSelectLead(company);
      onOpenChange(false);
      return;
    }

    // Procura se já existe projeto para esta empresa
    const existing = projects.find(
      (p) => p.name.toLowerCase() === company.name.toLowerCase(),
    );

    let projId = existing?.id;
    if (!projId) {
      projId = createProject(company.name);
    }
    selectProject(projId);

    const address = company.address || company.endereco || company.city || "Brasil";
    const phone = company.whatsapp || company.phone || company.telefone || "";
    const rating = company.rating || company.nota_google || 4.9;
    const reviews = company.reviews_count || company.total_avaliacoes || 50;
    const niche = company.niche || "Serviços / Comércio";
    const photos = company.photos || [];

    const briefingText = [
      `[CONTEXTO DO LEAD GOOGLE MEU NEGÓCIO]:`,
      `- Empresa: ${company.name}`,
      `- Nicho: ${niche}`,
      `- Endereço: ${address}`,
      `- WhatsApp: ${phone || "Disponível"}`,
      `- Nota Google: ${rating} estrelas (${reviews} avaliações)`,
      photos.length > 0 ? `- Fotos do Google Maps: ${photos.slice(0, 8).join(" | ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    updateActiveProjectBriefing(briefingText);

    addChatMessage({
      id: `lead-${company.id}-${Date.now()}`,
      role: "assistant",
      content: `Olá! Sincronizei todos os dados do **Google Meu Negócio** de **${company.name}**:\n\n📍 **Endereço:** ${address}\n📞 **WhatsApp:** ${phone || "Não informado"}\n⭐ **Google:** Nota ${rating} (${reviews} avaliações)\n${photos.length > 0 ? `📸 **Fotos reais:** ${photos.length} fotos do Google disponíveis para a demonstração\n` : ""}\nClique em **"Gerar Demonstração com Dados do Google"** ou envie sua instrução para construir a página agora mesmo!`,
      timestamp: Date.now(),
    });

    toast.success(`Dados de "${company.name}" carregados no Gemini!`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border border-white/10 text-white p-6 shadow-2xl rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="text-left space-y-1.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-zinc-950 flex items-center justify-center text-amber-400">
                <MapPin size={16} />
              </div>
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Leads do Google Meu Negócio</span>
                <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Radar Ativo
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Selecione qualquer empresa prospectada para alimentar o Gemini com fotos, avaliações e localização real.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Campo de Busca Rápida */}
        <div className="relative my-3 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome da empresa, nicho (ex: barbearia, dentista) ou cidade..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Lista de Empresas Prospectadas */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="text-xs">Carregando empresas prospectadas...</span>
            </div>
          )}

          {!loading && filteredCompanies.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold text-zinc-400">Nenhum lead encontrado</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {searchQuery
                  ? "Tente buscar com outro termo."
                  : "Use o Radar de Prospecção para importar ou pesquisar empresas no Google Maps."}
              </p>
            </div>
          )}

          {!loading &&
            filteredCompanies.map((c) => {
              const address = c.address || c.endereco || c.city || "";
              const phone = c.whatsapp || c.phone || c.telefone || "";
              const rating = c.rating || c.nota_google || 4.9;
              const reviews = c.reviews_count || c.total_avaliacoes || 0;
              const photos = c.photos || [];

              return (
                <div
                  key={c.id}
                  onClick={() => handlePickCompany(c)}
                  className="p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {c.name}
                      </h4>
                      {c.niche && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/10">
                          {c.niche}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {rating} ({reviews})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 truncate">
                      {address && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin size={11} className="text-zinc-500 shrink-0" />
                          <span className="truncate">{address}</span>
                        </span>
                      )}
                      {phone && (
                        <span className="inline-flex items-center gap-1 shrink-0">
                          <Phone size={11} className="text-zinc-500" />
                          <span>{phone}</span>
                        </span>
                      )}
                    </div>

                    {photos.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {photos.slice(0, 4).map((p, idx) => (
                          <img
                            key={idx}
                            src={p}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover border border-white/10"
                          />
                        ))}
                        <span className="text-[10px] text-zinc-400 ml-1">
                          +{photos.length} fotos reais do Google
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-black text-xs font-bold transition-all flex items-center gap-1 border border-emerald-500/30 group-hover:border-transparent"
                  >
                    <span>Carregar</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
