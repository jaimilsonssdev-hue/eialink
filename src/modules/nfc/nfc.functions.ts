import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DynamicLink } from "./types";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

/**
 * Constrói a URL oficial do Google que abre diretamente o pop-up de avaliação 5 estrelas
 */
export function buildGoogleReviewUrl(input: string): string {
  if (!input || !input.trim()) return "";
  const trimmed = input.trim();

  // Se já for uma URL completa do Google write review ou g.page
  if (
    trimmed.startsWith("https://search.google.com/local/writereview") ||
    trimmed.includes("g.page/r/")
  ) {
    return trimmed;
  }

  // Se for uma URL do Google Maps com place_id ou placeid
  if (trimmed.includes("placeid=") || trimmed.includes("place_id=")) {
    const match = trimmed.match(/place_?id=([a-zA-Z0-9_\-]+)/);
    if (match?.[1]) {
      return `https://search.google.com/local/writereview?placeid=${match[1]}`;
    }
  }

  // Se for apenas o Place ID (geralmente começa com ChIJ ou similar)
  if (!trimmed.startsWith("http") && trimmed.length > 10) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * 1. Listar todos os links dinâmicos / plaquinhas cadastradas
 */
export const listDynamicLinksFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const supabase = getServiceSupabase();
    if (!supabase) return { links: [] as DynamicLink[] };

    try {
      // Busca as configurações globais armazenadas nos planos
      const { data: plans } = await supabase
        .from("plans")
        .select("id, slug, features")
        .order("id", { ascending: true });

      if (!plans || plans.length === 0) {
        return { links: [] as DynamicLink[] };
      }

      // Procura primeiro no plano 'pro', senão no primeiro plano disponível
      const targetPlan = plans.find((p) => p.slug === "pro") || plans[0];
      const features = (targetPlan.features as Record<string, unknown>) || {};
      const links = (features.nfc_dynamic_links as DynamicLink[]) || [];

      // Ordena pelos mais recentes
      links.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { links };
    } catch (err) {
      console.error("Erro ao listar links dinâmicos:", err);
      return { links: [] as DynamicLink[] };
    }
  });

/**
 * 2. Salvar ou atualizar link dinâmico
 */
export const saveDynamicLinkFn = createServerFn({ method: "POST" })
  .inputValidator((data: { link: Partial<DynamicLink> & { code: string; title: string } }) => {
    if (!data.link.code) throw new Error("O código/slug curto é obrigatório.");
    if (!data.link.title) throw new Error("O título da plaquinha é obrigatório.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Serviço de banco de dados indisponível.");

    const { data: plans } = await supabase
      .from("plans")
      .select("id, slug, features")
      .order("id", { ascending: true });

    if (!plans || plans.length === 0) {
      throw new Error("Nenhum plano configurado no sistema.");
    }

    const targetPlan = plans.find((p) => p.slug === "pro") || plans[0];
    const features = (targetPlan.features as Record<string, unknown>) || {};
    const links: DynamicLink[] = (features.nfc_dynamic_links as DynamicLink[]) || [];

    const now = new Date().toISOString();
    const cleanCode = data.link.code
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, "-");

    // Verifica se já existe outro link com o mesmo slug
    const existingIndex = links.findIndex((l) => l.code.toLowerCase() === cleanCode);
    const existingId = data.link.id;

    if (existingIndex >= 0 && links[existingIndex].id !== existingId) {
      throw new Error(`O código '${cleanCode}' já está em uso por outra plaquinha.`);
    }

    // Processa URL de destino inteligente dependendo do tipo
    let finalTargetUrl = data.link.target_url?.trim() || "";
    if (data.link.type === "google_review") {
      finalTargetUrl = buildGoogleReviewUrl(data.link.google_place_id || finalTargetUrl);
    } else if (data.link.type === "instagram") {
      const username = (data.link.instagram_username || "").replace("@", "").trim();
      if (username) {
        finalTargetUrl = `https://instagram.com/${username}`;
      }
    } else if (data.link.type === "whatsapp") {
      const phoneDigits = (data.link.whatsapp_number || "").replace(/\D/g, "");
      if (phoneDigits) {
        finalTargetUrl = `https://wa.me/${phoneDigits}`;
      }
    }

    const linkToSave: DynamicLink = {
      id: existingId || `nfc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: cleanCode,
      title: data.link.title.trim(),
      company_name: data.link.company_name?.trim() || "Empresa",
      type: data.link.type || "custom",
      target_url: finalTargetUrl,
      active: data.link.active ?? true,
      clicks_count: data.link.clicks_count ?? 0,
      last_accessed_at: data.link.last_accessed_at ?? null,
      google_place_id: data.link.google_place_id?.trim() || null,
      pix_key: data.link.pix_key?.trim() || null,
      pix_receiver_name: data.link.pix_receiver_name?.trim() || null,
      pix_city: data.link.pix_city?.trim() || null,
      instagram_username: data.link.instagram_username?.trim() || null,
      whatsapp_number: data.link.whatsapp_number?.trim() || null,
      vcard_data: data.link.vcard_data || null,
      notes: data.link.notes?.trim() || null,
      created_at: data.link.created_at || now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      // Atualiza link existente mantendo contagem de cliques
      links[existingIndex] = {
        ...links[existingIndex],
        ...linkToSave,
        clicks_count: links[existingIndex].clicks_count,
        created_at: links[existingIndex].created_at,
      };
    } else {
      // Adiciona novo link
      links.push(linkToSave);
    }

    // Salva em todos os planos padrão para manter integridade
    for (const plan of plans) {
      const pFeatures = (plan.features as Record<string, unknown>) || {};
      await supabase
        .from("plans")
        .update({
          features: {
            ...pFeatures,
            nfc_dynamic_links: links,
          },
        })
        .eq("id", plan.id);
    }

    return { success: true, link: linkToSave };
  });

/**
 * 3. Excluir link dinâmico
 */
export const deleteDynamicLinkFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!data.id) throw new Error("ID do link é obrigatório.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Serviço de banco de dados indisponível.");

    const { data: plans } = await supabase.from("plans").select("id, features");
    if (!plans || plans.length === 0) return { success: true };

    for (const plan of plans) {
      const features = (plan.features as Record<string, unknown>) || {};
      const links = ((features.nfc_dynamic_links as DynamicLink[]) || []).filter(
        (l) => l.id !== data.id,
      );

      await supabase
        .from("plans")
        .update({
          features: {
            ...features,
            nfc_dynamic_links: links,
          },
        })
        .eq("id", plan.id);
    }

    return { success: true };
  });

/**
 * 4. Resolver código curto (/r/$code), registrar estatística de clique/tap e retornar destino
 */
export const resolveDynamicLinkFn = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => {
    if (!data.code) throw new Error("Código é obrigatório.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) return { found: false };

    const cleanCode = data.code.toLowerCase().trim();

    try {
      const { data: plans } = await supabase
        .from("plans")
        .select("id, slug, features")
        .order("id", { ascending: true });

      if (!plans || plans.length === 0) return { found: false };

      const targetPlan = plans.find((p) => p.slug === "pro") || plans[0];
      const features = (targetPlan.features as Record<string, unknown>) || {};
      const links = (features.nfc_dynamic_links as DynamicLink[]) || [];

      const foundIndex = links.findIndex(
        (l) => l.active && l.code.toLowerCase() === cleanCode,
      );

      if (foundIndex === -1) {
        return { found: false };
      }

      const link = links[foundIndex];

      // Incrementa contador de acessos e salva assincronamente
      link.clicks_count = (link.clicks_count || 0) + 1;
      link.last_accessed_at = new Date().toISOString();
      links[foundIndex] = link;

      // Persiste incremento
      supabase
        .from("plans")
        .update({
          features: {
            ...features,
            nfc_dynamic_links: links,
          },
        })
        .eq("id", targetPlan.id)
        .then(() => {})
        .catch((e) => console.warn("Erro ao atualizar clicks_count:", e));

      return {
        found: true,
        link,
      };
    } catch (err) {
      console.error("Erro ao resolver link dinâmico:", err);
      return { found: false };
    }
  });
