import { GoogleGenAI } from "@google/genai";
import { resolveCreativeStudioApiKeyAsync } from "@/modules/studiopro/lib/creativeEngineService";
import { supabase } from "@/integrations/supabase/client";

export interface AgendaServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  badge?: string;
  popular?: boolean;
}

export interface AgendaProfessional {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface AgendaStudioData {
  businessName: string;
  niche: "barbearia" | "salao_beleza" | "estetica" | "clinica" | "tatuagem" | "geral";
  tagline: string;
  description: string;
  whatsapp: string;
  address?: string;
  openingHours?: string;
  instagram?: string;
  themeStyle: "dark-barber" | "clean-aesthetic" | "luxury-gold" | "modern-slate";
  accentColor: "amber" | "emerald" | "rose" | "sky" | "violet" | "gold";
  professionals: AgendaProfessional[];
  services: AgendaServiceItem[];
}

export type AgendaData = AgendaStudioData;

export interface AgendaAiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  attachments?: Array<{
    name: string;
    mimeType: string;
    dataBase64: string;
  }>;
}

const AGENDA_AI_SYSTEM_PROMPT = `Você é o Diretor Criativo & Arquiteto de Agendamentos do "Gerador de Agendas Inteligentes" do EIA Link.
Você é especialista em transformar Barbearias, Salões de Beleza, Clínicas de Estética e Consultórios em máquinas de agendamento pelo WhatsApp e online.

SEU TOM DE VOZ:
- Seja parceiro, descontraído, com excelente energia e autoridade visual.
- Fale com entusiasmo de negócios ("Fala, mestre!", "Show de bola, vamos lotar a agenda dessa barbearia/salão!", "Separei os combos mais lucrativos aqui!").
- NUNCA use respostas genéricas ou robóticas.

SEUS SUPERPODERES:
1. **Multimodalidade Real**: Você lê fotos de flyers de barbearia, tabelas de preços de salão em papel, fotos de espaços de estética e PDFs. Extrai automaticamente o nome do serviço, o tempo estimado de cadeira (ex: 30min, 45min, 60min) e o valor.
2. **Engenharia de Combos de Alto Ticket**: Se a barbearia só tiver "Corte" e "Barba", sugira combos irresistíveis como "Combo Master: Cabelo + Barba Terapia + Toalha Quente".
3. **Estruturação JSON Estrita**:
Sempre que for sugerir ou atualizar os serviços e a página de agendamento, retorne no final da sua resposta um bloco JSON cercado por \`\`\`json { ... } \`\`\` com a seguinte estrutura completa:

\`\`\`json
{
  "businessName": "Nome do Espaço",
  "niche": "barbearia",
  "tagline": "Slogan de alto impacto e autoridade",
  "description": "Apresentação da experiência de atendimento",
  "whatsapp": "5511999999999",
  "address": "Av. Principal, 500",
  "openingHours": "Segunda a Sábado das 09h às 20h",
  "instagram": "@nomedoespaco",
  "themeStyle": "dark-barber",
  "accentColor": "amber",
  "professionals": [
    { "id": "prof-1", "name": "Mestre Barbeiro", "role": "Especialista em Degradê & Barba" }
  ],
  "services": [
    {
      "id": "srv-1",
      "name": "Corte Degradê & Fade",
      "description": "Corte preciso com navalha, acabamento perfeito e lavagem inclusa.",
      "durationMinutes": 35,
      "price": 45.0,
      "category": "Cortes",
      "badge": "Mais Procurado ⭐",
      "popular": true
    },
    {
      "id": "srv-2",
      "name": "Barboterapia Tradicional",
      "description": "Tratamento relaxante com toalha quente, óleos essenciais e alinhamento milimétrico na navalha.",
      "durationMinutes": 30,
      "price": 35.0,
      "category": "Barba",
      "badge": "Relaxamento",
      "popular": false
    }
  ]
}
\`\`\`

Regras:
- Temas válidos para themeStyle: "dark-barber", "clean-aesthetic", "luxury-gold", "modern-slate".
- Cores válidas para accentColor: "amber", "emerald", "rose", "sky", "violet", "gold".
- Mantenha sempre a conversa envolvente na primeira parte da resposta e o JSON atualizado na segunda parte.`;

/**
 * Processa chat multimodal do Agenda Studio com Gemini 3.8 Flash
 */
export async function processAgendaAiChat(
  history: AgendaAiMessage[],
  newMessage: string,
  attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>,
  currentAgenda?: AgendaStudioData | null,
  apiKey?: string,
): Promise<{ replyText: string; updatedAgenda: AgendaStudioData | null }> {
  const key = await resolveCreativeStudioApiKeyAsync(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const formattedContents: any[] = [];

  if (currentAgenda) {
    formattedContents.push({
      role: "user",
      parts: [
        {
          text: `[ESTADO ATUAL DA AGENDA/SERVIÇOS]:\n${JSON.stringify(currentAgenda, null, 2)}\nUse esse estado como base para editar, adicionar ou refinar o que o usuário pedir.`,
        },
      ],
    });
    formattedContents.push({
      role: "model",
      parts: [
        {
          text: `Perfeito! Já estou com a estrutura de serviços e agendamento do "${currentAgenda.businessName}" em mãos. O que vamos ajustar ou adicionar agora?`,
        },
      ],
    });
  }

  for (const msg of history) {
    const parts: any[] = [];
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    parts.push({ text: msg.content });
    formattedContents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    });
  }

  const currentParts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  currentParts.push({ text: newMessage });
  formattedContents.push({
    role: "user",
    parts: currentParts,
  });

  const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash"];
  let rawText = "";

  for (const model of modelsToTry) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: {
          systemInstruction: AGENDA_AI_SYSTEM_PROMPT,
          temperature: 0.6,
        },
      });
      rawText = res.text?.trim() || "";
      if (rawText) break;
    } catch (err) {
      console.warn(`[AgendaAiService] Falha com modelo ${model}:`, err);
    }
  }

  if (!rawText) {
    throw new Error("A IA de Agendamento não conseguiu processar sua solicitação no momento. Tente novamente.");
  }

  let updatedAgenda: AgendaStudioData | null = null;
  const jsonMatch = rawText.match(/```json([\s\S]*?)```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed.businessName && Array.isArray(parsed.services)) {
        updatedAgenda = parsed as AgendaStudioData;
      }
    } catch (parseErr) {
      console.warn("[AgendaAiService] Erro ao fazer parse do JSON retornado:", parseErr);
    }
  }

  const conversationalText = rawText.replace(/```json[\s\S]*?```/i, "").trim();

  return {
    replyText: conversationalText || "Prontinho! Atualizei os serviços e horários da agenda. Dá uma olhada na tela ao lado!",
    updatedAgenda,
  };
}

/**
 * Cria ou salva a página de agendamento diretamente no Supabase (bio_pages)
 */
export async function saveAgendaToBioPage(
  agenda: AgendaStudioData,
  existingPageId?: string,
): Promise<{ success: boolean; pageId: string; slug: string; publicUrl: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error("Usuário não autenticado para salvar página de agendamento.");
  }
  const userId = userData.user.id;

  const rawSlug = agenda.businessName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = rawSlug || "agendamento-online";

  if (!existingPageId) {
    const { data: slugCheck } = await supabase
      .from("bio_pages")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugCheck) {
      slug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  const payload = {
    user_id: userId,
    slug,
    display_name: agenda.businessName,
    description: agenda.tagline || agenda.description,
    whatsapp: agenda.whatsapp || null,
    template_id: "agenda-pro",
    published: true,
    social_links: {
      is_agenda_page: true,
      agenda_data: agenda,
      address: agenda.address,
      opening_hours: agenda.openingHours,
      instagram: agenda.instagram,
      suggested_services: agenda.services.map((s) => ({
        name: s.name,
        description: s.description,
        price: s.price,
        durationMinutes: s.durationMinutes,
        badge: s.badge,
      })),
    },
    updated_at: new Date().toISOString(),
  };

  let pageId = existingPageId;
  if (pageId) {
    const { error } = await supabase
      .from("bio_pages")
      .update(payload)
      .eq("id", pageId)
      .eq("user_id", userId);
    if (error) throw new Error(`Erro ao atualizar página de agendamento: ${error.message}`);
  } else {
    const { data: created, error } = await supabase
      .from("bio_pages")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(`Erro ao salvar página de agendamento: ${error.message}`);
    pageId = created.id;
  }

  return {
    success: true,
    pageId: pageId!,
    slug,
    publicUrl: `/p/${slug}`,
  };
}

