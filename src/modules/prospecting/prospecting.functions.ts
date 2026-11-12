import { createServerFn } from "@tanstack/react-start";
import { lookupBusinessProfile } from "./LiveProspectingEngine";
import { prospectingSearchSchema } from "./validation";
import type { ProspectDraft } from "./types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildDedupeKey } from "./scoring";

export const runLiveProspecting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { niche: string; city: string; limit?: number; page?: number; apifyToken?: string }) =>
    prospectingSearchSchema.parse(data),
  )
  .handler(async ({ data, context }): Promise<ProspectDraft[]> => {
    const supabase = context.supabase;
    const { data: edgeData, error } = await supabase.functions.invoke("prospectar-gemini", {
      body: {
        niche: data.niche,
        city: data.city,
        saveToDatabase: true,
      },
    });

    if (error) {
      throw new Error(`Erro na Edge Function prospectar-gemini: ${error.message}`);
    }

    const rawLeads = Array.isArray(edgeData?.leads) ? edgeData.leads : [];
    return rawLeads.map((item: any) => {
      const nome = (item.nome || "").trim();
      const phone = item.telefone || null;
      const dedupeKey = buildDedupeKey(nome, phone || item.endereco || data.city);
      const score = typeof item.nota_google === "number"
        ? Math.min(100, Math.round((item.nota_google * 15) + (phone ? 25 : 0)))
        : 70;

      return {
        name: nome,
        niche: item.niche_slug || data.niche,
        niche_slug: item.niche_slug || data.niche,
        city: data.city,
        state: null,
        phone,
        telefone: phone,
        whatsapp: phone,
        email: null,
        instagram: null,
        website: null,
        has_website: false,
        endereco: item.endereco || null,
        address: item.endereco || null,
        latitude: typeof item.latitude === "number" ? item.latitude : null,
        longitude: typeof item.longitude === "number" ? item.longitude : null,
        rating: typeof item.nota_google === "number" ? item.nota_google : null,
        nota_google: typeof item.nota_google === "number" ? item.nota_google : null,
        reviews_count: typeof item.total_avaliacoes === "number" ? item.total_avaliacoes : null,
        total_avaliacoes: typeof item.total_avaliacoes === "number" ? item.total_avaliacoes : null,
        source: "gemini-maps",
        score,
        priority: score >= 80 ? "alta" : "media",
        status: "novo" as const,
        notes: item.endereco ? `[Google Maps Grounding] ${item.endereco}` : "[Google Maps Grounding]",
        dedupe_key: dedupeKey,
      };
    });
  });

export const lookupBusinessProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { query: string }) => {
    const query = (data?.query ?? "").trim();
    if (!query) {
      throw new Error("Termo ou link de busca obrigatório.");
    }
    if (query.length > 200 || /(<\s*\/?\s*\w|javascript:|on\w+\s*=)/i.test(query)) {
      throw new Error("Termo de busca inválido.");
    }
    return { query };
  })
  .handler(async ({ data }): Promise<ProspectDraft[]> => {
    return await lookupBusinessProfile(data.query);
  });
