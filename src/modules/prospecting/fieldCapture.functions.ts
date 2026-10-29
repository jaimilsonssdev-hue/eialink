import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveGeminiApiKeyAsync, getAvailableGeminiModels } from "@/modules/ai/google-ai.service";
import { GoogleGenAI } from "@google/genai";
import { buildDedupeKey, priorityFromScore, scoreCompany } from "./scoring";
import type { ProspectedCompany } from "./types";

export interface FieldPhotoAnalysisResult {
  name: string;
  niche: string;
  primaryColors: string;
  phone: string | null;
  city: string | null;
  headline: string;
  summary: string;
  publicPhotoUrl?: string | null;
}

/**
 * Analisa a foto de uma fachada ou estabelecimento comercial com Gemini 3.8 Flash:
 * 1. Faz OCR no letreiro/placa para extrair nome e telefone.
 * 2. Identifica o nicho e as cores da marca.
 * 3. Salva a foto na CDN do Supabase (bio-media) para uso direto no Hero do site.
 */
export const analyzeFieldPhotoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      photoBase64: string;
      mimeType?: string;
      quickHint?: string;
    }) => d,
  )
  .handler(async ({ data, context }: any): Promise<{ ok: boolean; data?: FieldPhotoAnalysisResult; error?: string }> => {
    try {
      const supabase = context?.supabase;
      if (!supabase) throw new Error("Sessão não autenticada.");

      const cleanBase64 = data.photoBase64.includes(",")
        ? data.photoBase64.split(",")[1]
        : data.photoBase64;
      const mime = data.mimeType || "image/jpeg";

      // 1. Tenta salvar a imagem no bucket bio-media para ter URL pública permanente
      let publicPhotoUrl: string | null = null;
      try {
        const fileExt = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
        const fileName = `facade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
        const buffer = Buffer.from(cleanBase64, "base64");

        const { error: uploadError } = await supabase.storage
          .from("bio-media")
          .upload(fileName, buffer, {
            contentType: mime,
            upsert: true,
          });

        if (!uploadError) {
          const { data: pubData } = supabase.storage.from("bio-media").getPublicUrl(fileName);
          publicPhotoUrl = pubData?.publicUrl || null;
        }
      } catch (storageErr) {
        console.warn("[FieldCapture] Upload para storage falhou, prosseguindo com análise:", storageErr);
      }

      // 2. Resolve chave da API Gemini
      let resolvedKey = await resolveGeminiApiKeyAsync();
      if (!resolvedKey) {
        const { data: userData } = await supabase.auth.getUser();
        resolvedKey = userData?.user?.user_metadata?.gemini_api_key;
      }
      if (!resolvedKey) {
        throw new Error("Chave do Google AI Studio não configurada no painel.");
      }

      // 3. Consulta modelos autorizados priorizando estritamente gemini-3.8-flash
      const availableModels = await getAvailableGeminiModels(resolvedKey);
      const targetModel = availableModels.find((m) => m === "gemini-3.8-flash") || "gemini-3.8-flash";

      const ai = new GoogleGenAI({ apiKey: resolvedKey });

      const promptText = `Você é um perito em análise visual comercial de fachadas e identidade de marcas.
Analise a foto desta fachada/comércio com rigor e extraia:
1. "name": O nome oficial ou comercial do negócio (leia o letreiro, placa, toldo ou fachada com máxima precisão). Se não houver letreiro claro, crie um nome condizente com o estilo e visual.
2. "niche": O nicho ou ramo de atividade exato (ex: barbearia, restaurante, pizzaria, odontologia, clinica, estetica, oficina, pet shop, loja de roupas, confeitaria, academia, etc.).
3. "primaryColors": 2 a 3 cores marcantes da fachada ou identidade para usar no design do site (ex: "Preto fosco e Dourado nobre", "Azul marinho e Branco", "Verde oliva e Madeira").
4. "phone": Número de telefone ou WhatsApp visível no letreiro/fachada (ou null se não houver).
5. "city": Cidade ou bairro se estiver visível (ou null se não houver).
6. "headline": Uma frase marcante de abertura para o site desta empresa.
7. "summary": Um resumo de 2 frases sobre a atmosfera e qualidade do estabelecimento.
${data.quickHint ? `DICA ADICIONAL DO USUÁRIO: "${data.quickHint}"` : ""}

Responda APENAS em JSON válido no formato:
{
  "name": "string",
  "niche": "string",
  "primaryColors": "string",
  "phone": "string ou null",
  "city": "string ou null",
  "headline": "string",
  "summary": "string"
}`;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mime,
                  data: cleanBase64,
                },
              },
              { text: promptText },
            ],
          },
        ],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text?.trim() || "";
      const cleanJson = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleanJson);

      return {
        ok: true,
        data: {
          name: parsed.name || "Estabelecimento Comercial",
          niche: parsed.niche || "comercio",
          primaryColors: parsed.primaryColors || "Moderno e Elegante",
          phone: parsed.phone || null,
          city: parsed.city || null,
          headline: parsed.headline || "Excelência e atendimento com padrão superior.",
          summary: parsed.summary || "Espaço com estrutura moderna e atendimento dedicado.",
          publicPhotoUrl,
        },
      };
    } catch (err: any) {
      console.error("[FieldCapture] Falha na análise da foto:", err);
      return {
        ok: false,
        error: err?.message || "Não foi possível analisar a foto da fachada.",
      };
    }
  });

/**
 * Cria ou recupera um lead diretamente no Radar a partir da captura em campo
 */
export const createFieldProspectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      name: string;
      niche?: string;
      city?: string;
      phone?: string;
      whatsapp?: string;
      address?: string;
      photoUrl?: string;
      rating?: number;
      reviewsCount?: number;
      notes?: string;
      source?: string;
    }) => d,
  )
  .handler(async ({ data, context }: any): Promise<{ ok: boolean; company?: ProspectedCompany; error?: string }> => {
    try {
      const supabase = context?.supabase;
      const userId = context?.userId;
      if (!supabase) throw new Error("Sessão não autenticada.");

      const cleanPhone = (data.whatsapp || data.phone || "").replace(/\D/g, "");
      const dedupeKey = buildDedupeKey(data.name, data.city || null, cleanPhone || null);

      let notes = data.notes || "";
      if (data.photoUrl && !notes.includes("[Fotos:")) {
        notes = notes ? `${notes} · [Fotos: ${data.photoUrl}]` : `[Fotos: ${data.photoUrl}]`;
      }
      if (data.address && !notes.includes("[Endereço:")) {
        notes = notes ? `${notes} · [Endereço: ${data.address}]` : `[Endereço: ${data.address}]`;
      }

      const score = scoreCompany({
        name: data.name,
        niche: data.niche || null,
        city: data.city || null,
        phone: cleanPhone || null,
        whatsapp: cleanPhone || null,
        email: null,
        instagram: null,
        website: null,
        has_website: false,
        rating: data.rating || 5.0,
        reviews_count: data.reviewsCount || 25,
      });

      const payload = {
        name: data.name.trim(),
        niche: data.niche || "comercio",
        city: data.city || null,
        state: null,
        phone: cleanPhone || null,
        whatsapp: cleanPhone || null,
        email: null,
        instagram: null,
        website: null,
        has_website: false,
        rating: data.rating || 5.0,
        reviews_count: data.reviewsCount || 25,
        score,
        priority: priorityFromScore(score),
        source: data.source || "campo",
        status: "novo" as const,
        notes: notes || null,
        dedupe_key: dedupeKey,
        created_by: userId,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("prospected_companies")
        .upsert(payload, { onConflict: "dedupe_key" })
        .select("*")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return {
        ok: true,
        company: inserted as ProspectedCompany,
      };
    } catch (err: any) {
      console.error("[FieldCapture] Falha ao registrar lead de campo:", err);
      return {
        ok: false,
        error: err?.message || "Erro ao registrar no radar.",
      };
    }
  });

