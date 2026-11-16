import { supabase } from "@/integrations/supabase/client";
import { priorityFromScore, scoreCompany } from "./scoring";
import type {
  ProspectDraft,
  ProspectStatus,
  ProspectedCompany,
  ProspectingActivity,
} from "./types";

function sanitizeProspectPayload(draft: ProspectDraft, userId: string | null) {
  let notes = draft.notes ?? "";

  // Incorpora fotos reais adicionais
  const extraPhotos = (draft as any).photos;
  if (Array.isArray(extraPhotos) && extraPhotos.length > 0 && !notes.includes("[Fotos:")) {
    const photoList = extraPhotos.slice(0, 12).join(" | ");
    notes = notes ? `${notes} · [Fotos: ${photoList}]` : `[Fotos: ${photoList}]`;
  }

  // Preserva endereço em notes (coluna 'endereco' não existe fisicamente na tabela)
  const enderecoVal = (draft.endereco || (draft as any).address || "").trim();
  if (enderecoVal && !notes.includes("[Endereço:") && !notes.includes(enderecoVal)) {
    notes = notes ? `${notes} · [Endereço: ${enderecoVal}]` : `[Endereço: ${enderecoVal}]`;
  }

  // Preserva coordenadas em notes (colunas 'latitude'/'longitude' não existem fisicamente na tabela)
  if (
    typeof draft.latitude === "number" &&
    typeof draft.longitude === "number" &&
    !notes.includes("[Geo:")
  ) {
    notes = notes
      ? `${notes} · [Geo: ${draft.latitude},${draft.longitude}]`
      : `[Geo: ${draft.latitude},${draft.longitude}]`;
  }

  const phoneValue = draft.phone ?? draft.telefone ?? draft.whatsapp ?? null;
  const whatsappValue = draft.whatsapp ?? draft.telefone ?? draft.phone ?? null;
  const ratingValue =
    typeof draft.rating === "number"
      ? draft.rating
      : typeof draft.nota_google === "number"
      ? draft.nota_google
      : null;
  const reviewsCountValue =
    typeof draft.reviews_count === "number"
      ? draft.reviews_count
      : typeof draft.total_avaliacoes === "number"
      ? draft.total_avaliacoes
      : null;

  const cleanScore =
    typeof draft.score === "number"
      ? Math.min(100, Math.max(0, Math.round(draft.score)))
      : 0;
  const cleanPriority = ["alta", "media", "baixa"].includes(
    draft.priority as string,
  )
    ? draft.priority
    : "media";
  const cleanStatus = [
    "novo",
    "contatado",
    "respondeu",
    "reuniao",
    "proposta",
    "cliente",
    "descartado",
  ].includes(draft.status as string)
    ? draft.status
    : "novo";

  const payload: Record<string, any> = {
    name: draft.name.trim(),
    niche: draft.niche ?? draft.niche_slug ?? null,
    city: draft.city ?? null,
    state: draft.state ?? null,
    phone: phoneValue,
    whatsapp: whatsappValue,
    email: draft.email ?? null,
    instagram: draft.instagram ?? null,
    website: draft.website ?? null,
    has_website: Boolean(draft.has_website),
    rating: ratingValue,
    reviews_count: reviewsCountValue,
    score: cleanScore,
    priority: cleanPriority,
    source: draft.source ?? "gemini-search",
    status: cleanStatus,
    notes: notes ? notes.trim() : null,
    dedupe_key: draft.dedupe_key,
  };

  if (userId) {
    payload.created_by = userId;
  }

  return payload;
}

export const ProspectingService = {
  async list(): Promise<ProspectedCompany[]> {
    const { data, error } = await supabase
      .from("prospected_companies")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as any[];
    return rows.map((c) => {
      let photos = c.photos;
      if ((!photos || photos.length === 0) && c.notes && c.notes.includes("[Fotos:")) {
        const match = c.notes.match(/\[Fotos:\s*([^\]]+)\]/);
        if (match) {
          photos = match[1].split("|").map((p: string) => p.trim()).filter((p: string) => p.startsWith("http"));
        }
      }

      let endereco = c.endereco || null;
      if (!endereco && c.notes) {
        const addrMatch = c.notes.match(/\[(?:Endereço|Google Search Grounding|Gemini \+ Search):\s*([^\]]+)\]/i);
        if (addrMatch) endereco = addrMatch[1].trim();
      }

      let latitude = typeof c.latitude === "number" ? c.latitude : null;
      let longitude = typeof c.longitude === "number" ? c.longitude : null;
      if ((latitude === null || longitude === null) && c.notes) {
        const geoMatch = c.notes.match(/\[Geo:\s*([-\d.]+)\s*,\s*([-\d.]+)\]/i);
        if (geoMatch) {
          latitude = parseFloat(geoMatch[1]);
          longitude = parseFloat(geoMatch[2]);
        }
      }

      const phoneVal = c.phone || c.telefone || null;
      const ratingVal =
        typeof c.rating === "number"
          ? c.rating
          : typeof c.nota_google === "number"
          ? c.nota_google
          : null;
      const reviewsVal =
        typeof c.reviews_count === "number"
          ? c.reviews_count
          : typeof c.total_avaliacoes === "number"
          ? c.total_avaliacoes
          : null;

      return {
        ...c,
        photos: photos || [],
        endereco: endereco || null,
        address: endereco || null,
        latitude,
        longitude,
        phone: phoneVal,
        telefone: phoneVal,
        whatsapp: c.whatsapp || phoneVal,
        niche: c.niche || c.niche_slug || null,
        niche_slug: c.niche_slug || c.niche || "servicos",
        rating: ratingVal,
        nota_google: ratingVal,
        reviews_count: reviewsVal,
        total_avaliacoes: reviewsVal,
      };
    });
  },

  async listDedupeKeys(): Promise<Set<string>> {
    const { data, error } = await supabase.from("prospected_companies").select("dedupe_key");
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map((row: any) => row.dedupe_key));
  },

  async listActivities(companyId: string): Promise<ProspectingActivity[]> {
    const { data, error } = await supabase
      .from("prospecting_activities")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ProspectingActivity[];
  },

  /** Insere ignorando duplicados já existentes (dedupe_key único). */
  async importMany(drafts: ProspectDraft[]) {
    if (!drafts.length) return { inserted: 0 };
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id ?? null;
    const payload = drafts.map((draft) => sanitizeProspectPayload(draft, userId));
    const { data, error } = await supabase
      .from("prospected_companies")
      .upsert(payload, { onConflict: "dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("[ProspectingService] Erro no upsert de importMany:", error);
      throw new Error(`Falha ao salvar no banco de dados: ${error.message}`);
    }
    return { inserted: data?.length ?? 0 };
  },

  async create(draft: ProspectDraft) {
    const score = scoreCompany(draft);
    const { data: user } = await supabase.auth.getUser();
    const cleanPayload = sanitizeProspectPayload(
      {
        ...draft,
        score,
        priority: priorityFromScore(score),
      },
      user.user?.id ?? null,
    );
    const { error } = await supabase.from("prospected_companies").insert(cleanPayload);
    if (error) {
      throw new Error(
        error.code === "23505" ? "Esta empresa já existe no radar." : error.message,
      );
    }
  },

  async updateStatus(id: string, status: ProspectStatus, nextActionAt?: string | null) {
    const { error } = await supabase
      .from("prospected_companies")
      .update({
        status,
        next_action_at: nextActionAt ?? null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async registerActivity(input: {
    companyId: string;
    channel: ProspectingActivity["channel"];
    outcome: ProspectingActivity["outcome"];
    message?: string | null;
    notes?: string | null;
    status?: ProspectStatus;
  }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Sessão expirada.");
    const { error } = await supabase.from("prospecting_activities").insert({
      company_id: input.companyId,
      admin_id: user.user.id,
      channel: input.channel,
      outcome: input.outcome,
      message: input.message ?? null,
      notes: input.notes ?? null,
    });
    if (error) throw new Error(error.message);
    const { error: updateError } = await supabase
      .from("prospected_companies")
      .update({
        last_contacted_at: new Date().toISOString(),
        ...(input.status ? { status: input.status } : {}),
      })
      .eq("id", input.companyId);
    if (updateError) throw new Error(updateError.message);
  },

  async remove(id: string) {
    const { error } = await supabase.from("prospected_companies").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async clearAll() {
    const { error } = await supabase
      .from("prospected_companies")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
  },

  async updateNotes(id: string, notes: string) {
    const { error } = await supabase
      .from("prospected_companies")
      .update({ notes })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async updateCompany(id: string, updates: Partial<ProspectedCompany>) {
    const {
      avatar_url,
      photos,
      biography,
      address,
      endereco,
      latitude,
      longitude,
      telefone,
      niche_slug,
      nota_google,
      total_avaliacoes,
      ...validPayload
    } = updates as Record<string, any>;

    let notes = validPayload.notes;
    if (endereco && typeof notes === "string" && !notes.includes("[Endereço:")) {
      notes = `${notes} · [Endereço: ${endereco}]`;
      validPayload.notes = notes;
    }

    if (niche_slug && !validPayload.niche) {
      validPayload.niche = niche_slug;
    }
    if (telefone && !validPayload.phone) {
      validPayload.phone = telefone;
    }
    if (nota_google !== undefined && validPayload.rating === undefined) {
      validPayload.rating = nota_google;
    }
    if (total_avaliacoes !== undefined && validPayload.reviews_count === undefined) {
      validPayload.reviews_count = total_avaliacoes;
    }

    const { error } = await supabase
      .from("prospected_companies")
      .update(validPayload)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};


