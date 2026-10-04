import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  Palette,
  Image as ImageIcon,
  MessageSquare,
  Flame,
  ShieldCheck,
  Star,
  ExternalLink,
  Edit3,
} from "lucide-react";
import {
  synthesizeSiteIdeationFn,
  createSiteFromIdeationDossierFn,
  type IdeationDossier,
  type IdeationInput,
} from "@/modules/prospecting/ideation.functions";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface SiteIdeationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    name: string;
    niche: string;
    city: string;
    whatsapp?: string | null;
    address?: string | null;
    rating?: number | null;
    reviews_count?: number | null;
    instagram?: string | null;
    photos?: string[];
  } | null;
  userId: string;
}

const TEMPLATE_CHOICES = [
  { id: "restaurant-menu", name: "Delivery & Cardápio", icon: "🍔", badge: "iFood & Delivery" },
  { id: "store-showcase", name: "Loja & Vitrine", icon: "🛍️", badge: "Catálogo & Varejo" },
  { id: "clinic-care", name: "Clínica & Saúde", icon: "🩺", badge: "Agendamento" },
  { id: "cinematic-glass", name: "Cinematográfico Glass", icon: "✨", badge: "Cinema & Vídeo" },
  { id: "site-maquina", name: "Página Máquina", icon: "⚡", badge: "Conversão Direta" },
];

const ARCHETYPE_CHOICES = [
  { id: "neobrutalism", name: "Neobrutalismo", icon: "⚡", badge: "Sombras 3D & Caixas Altas" },
  { id: "editorial", name: "Editorial Suíço", icon: "🏛️", badge: "Serifa & Quiet Luxury" },
  { id: "bento", name: "Bento High-Tech", icon: "🍱", badge: "Gradientes & SaaS" },
  { id: "cinematic", name: "Glassmorphism", icon: "✨", badge: "Vidro & Glow Neon" },
];

export function SiteIdeationModal({
  open,
  onOpenChange,
  lead,
  userId,
}: SiteIdeationModalProps) {
  const navigate = useNavigate();
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);
  const [generatingSite, setGeneratingSite] = useState(false);
  const [dossier, setDossier] = useState<IdeationDossier | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("cinematic-glass");
  const [selectedArchetype, setSelectedArchetype] = useState("cinematic");

  // Quando o modal abre, detecta modelo e arquétipo ideais por nicho
  React.useEffect(() => {
    if (lead) {
      const n = (lead.niche || "").toLowerCase();
      if (/hamburg|burger|pizza|barbearia|açaí|acai|lanche|restaurante|comida|delivery/i.test(n)) {
        setSelectedTemplate("restaurant-menu");
        setSelectedArchetype("neobrutalism");
      } else if (/odonto|dentista|est[eé]tica|cl[ií]nica|dermat|sa[uú]de|fisiot|médic/i.test(n)) {
        setSelectedTemplate("clinic-care");
        setSelectedArchetype("editorial");
      } else if (/loja|varejo|roupa|moda|calçado|joia|otica/i.test(n)) {
        setSelectedTemplate("store-showcase");
        setSelectedArchetype("editorial");
      } else if (/software|saas|advoc|contab|consultor|agencia|tecnologia/i.test(n)) {
        setSelectedTemplate("site-maquina");
        setSelectedArchetype("bento");
      } else {
        setSelectedTemplate("cinematic-glass");
        setSelectedArchetype("cinematic");
      }
    }
    if (open && lead && !dossier && !loadingSynthesis) {
      handleSynthesize();
    }
    if (!open) {
      setDossier(null);
    }
  }, [open, lead]);

  async function handleSynthesize() {
    if (!lead) return;
    setLoadingSynthesis(true);
    try {
      const input: IdeationInput = {
        businessName: lead.name,
        niche: lead.niche,
        city: lead.city,
        whatsapp: lead.whatsapp || undefined,
        address: lead.address || undefined,
        rating: lead.rating || undefined,
        reviewsCount: lead.reviews_count || undefined,
        instagramHandle: lead.instagram?.replace("@", "") || undefined,
        photos: lead.photos || [],
      };

      const res = await synthesizeSiteIdeationFn({ data: input });
      setDossier(res);
      toast.success("Ideação concluída! Super Prompt e Dossiê gerados.");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Erro ao sintetizar ideação do site.");
    } finally {
      setLoadingSynthesis(false);
    }
  }

  async function handleCreateSite() {
    if (!lead || !dossier) return;
    setGeneratingSite(true);
    try {
      const res = await createSiteFromIdeationDossierFn({
        data: {
          userId,
          businessName: lead.name,
          niche: lead.niche,
          city: lead.city,
          whatsapp: lead.whatsapp || undefined,
          address: lead.address || undefined,
          rating: lead.rating || undefined,
          templateId: selectedTemplate,
          archetype: selectedArchetype,
          dossier,
        },
      });

      toast.success("Site gerado com sucesso! Abrindo no Studio...");
      onOpenChange(false);
      // Redireciona para o Studio passando a página criada
      navigate({
        to: "/studio",
        search: { page: res.slug } as any,
      });
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar site.");
      setGeneratingSite(false);
    }
  }

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-white/10 text-white p-6 shadow-2xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Ideação Estratégica & Super Prompt
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Skill Creative Craft
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                {lead.name} • {lead.niche} em {lead.city}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingSynthesis ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200">
                Sintetizando inteligência do Google Maps & Instagram...
              </p>
              <p className="text-xs text-zinc-400 max-w-sm">
                Aplicando arquétipo visual, copywriting sensorial e curadoria de fotos para montar o Super Prompt.
              </p>
            </div>
          </div>
        ) : dossier ? (
          <div className="space-y-5 py-2">
            {/* 0. Modelo de Site Recomendado */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Modelo de Site Estratégico
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATE_CHOICES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      selectedTemplate === t.id
                        ? "bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{t.icon}</span>
                      <span className="truncate">{t.name}</span>
                    </div>
                    {selectedTemplate === t.id && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Arquétipo Visual & Atmosfera */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Arquétipo Visual & Atmosfera
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ARCHETYPE_CHOICES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedArchetype(a.id)}
                    className={`p-2.5 rounded-xl border text-left transition text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      selectedArchetype === a.id
                        ? "bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{a.icon}</span>
                      <div>
                        <p className="leading-tight">{a.name}</p>
                        <p className="text-[10px] text-zinc-400 font-normal leading-tight">{a.badge}</p>
                      </div>
                    </div>
                    {selectedArchetype === a.id && <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Headline & Proposta de Valor */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-violet-400" /> Copywriting Sensorial (Sem Clichês)
              </span>
              <h3 className="text-base font-bold text-white font-display leading-tight">
                "{dossier.heroHeadline}"
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {dossier.heroSubtitle}
              </p>
              <div className="pt-2 border-t border-white/10 text-xs text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{dossier.valueProposition}</span>
              </div>
            </div>

            {/* 3. Fotos Curadas */}
            {dossier.curatedPhotos.showcase.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-400" /> Fotos Mineradas para Vitrine
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {dossier.curatedPhotos.showcase.slice(0, 4).map((p, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-zinc-900 relative group"
                    >
                      <img src={p} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Super Prompt Estruturado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5 text-emerald-400" /> Super Prompt Estruturado
                </span>
                <span className="text-[11px] text-zinc-400">Você pode ajustar se quiser</span>
              </div>
              <textarea
                value={dossier.superPrompt}
                onChange={(e) => setDossier({ ...dossier, superPrompt: e.target.value })}
                className="w-full h-24 rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/60 leading-relaxed resize-none"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateSite}
                disabled={generatingSite}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {generatingSite ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gerando Site de Alta Conversão...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span>🚀 Gerar Site com esta Estrutura</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
