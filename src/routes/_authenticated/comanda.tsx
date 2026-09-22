import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Utensils, Sparkles, Plus, Loader2, Lock, MessageCircle } from "lucide-react";
import { PageService } from "@/modules/page/services/PageService";
import { ComandaManager } from "@/components/dashboard/ComandaManager";
import { Badge } from "@/components/ui/badge";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { useCommercialWhatsApp } from "@/modules/settings/services/CommercialSettingsService";

export const Route = createFileRoute("/_authenticated/comanda")({
  head: () => ({
    meta: [
      { title: "Comanda Digital & NFC — EIA Link" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComandaRoutePage,
});

function ComandaRoutePage() {
  const { data: access, isLoading: accessLoading } = usePlanAccess();
  const commercialWhatsApp = useCommercialWhatsApp();
  const pages = useQuery({
    queryKey: ["owned-bio-pages"],
    queryFn: () => PageService.listOwnedPages(),
  });

  const [selectedPageId, setSelectedPageId] = useState("");

  useEffect(() => {
    if (!selectedPageId && pages.data?.[0]) {
      setSelectedPageId(pages.data[0].id);
    }
  }, [pages.data, selectedPageId]);

  if (pages.isLoading || accessLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Carregando Comanda Digital...</span>
      </div>
    );
  }

  // Trava de liberação pelo Super Admin
  if (!access?.canAccessComanda) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-card p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Módulo de Comanda Bloqueado</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            O módulo de Comandas Digitais, Mesas e Garçons é um recurso exclusivo para o nicho de alimentação (bares, restaurantes e lanchonetes) e é liberado sob demanda pelo Super Admin.
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`https://wa.me/${commercialWhatsApp}?text=${encodeURIComponent(
              "Olá! Gostaria de ativar o módulo de Comanda Digital & Garçons na minha conta.",
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold shadow transition-all"
          >
            <MessageCircle className="h-4 w-4" /> Solicitar Liberação no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (!pages.data || pages.data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Utensils className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Crie sua página primeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Para ativar o sistema de comandas digitais, você precisa ter pelo menos um site ou biolink criado.
          </p>
        </div>
        <Link
          to="/pages"
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-semibold shadow transition-all"
        >
          <Plus className="h-4 w-4" /> Criar Minha Primeira Página
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Topo com Seletor de Página se tiver mais de uma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Comanda Digital & Gestão de Mesas
            </h1>
            <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3 mr-1" /> Nicho Alimentação
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure cartões NFC para seus garçons, plaquinhas de mesas e conecte o salão diretamente à cozinha.
          </p>
        </div>

        {pages.data.length > 1 && (
          <select
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            {pages.data.map((page) => (
              <option key={page.id} value={page.id}>
                {page.display_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedPageId && <ComandaManager bioPageId={selectedPageId} />}
    </div>
  );
}

