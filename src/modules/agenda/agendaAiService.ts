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
  themeStyle: "dark-barber" | "clean-aesthetic" | "luxury-gold" | "modern-slate" | string;
  accentColor: "amber" | "emerald" | "rose" | "sky" | "violet" | "gold" | string;
  visualEffect?: "glassmorphism" | "neobrutalism" | "elegante" | "parallax" | "clean";
  customFont?: string;
  buttonColor?: string;
  bannerImage?: string;
  features?: {
    selectPro?: boolean;
    selectDate?: boolean;
    whatsappBooking?: boolean;
    mapLocation?: boolean;
  };
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

function buildAgendaAiSystemPrompt(niche: string = "geral"): string {
  const effectiveNiche = (niche || "geral").trim();
  return `Você é o Diretor Criativo & Arquiteto de Agendamentos do "Gerador de Agendas Inteligentes" do EIA Link.
Você é especialista em estruturar agendas online e serviços de alta conversão para o nicho "${effectiveNiche}".

SEU TOM DE VOZ:
- Seja parceiro, descontraído, com excelente energia e autoridade visual.
- Fale com entusiasmo de negócios ("Fala, mestre!", "Show de bola, vamos estruturar a agenda para o nicho ${effectiveNiche}!", "Separei as melhores opções para o seu atendimento!").
- NUNCA use respostas genéricas ou robóticas.

SEUS SUPERPODERES:
1. **Multimodalidade Real**: Você lê fotos de tabelas de preços, flyers, catálogos de serviços e PDFs do nicho "${effectiveNiche}". Extrai automaticamente o nome do serviço, a duração estimada (ex: 30min, 45min, 60min) e o valor.
2. **Engenharia de Pacotes de Alto Ticket**: Sugira pacotes ou combinações de serviços coerentes exclusivamente com o nicho "${effectiveNiche}".
3. **Estruturação JSON Estrita**:
Sempre que for sugerir ou atualizar os serviços e a página de agendamento, retorne no final da sua resposta um bloco JSON cercado por \`\`\`json { ... } \`\`\` com a seguinte estrutura completa adaptada ao nicho "${effectiveNiche}":

\`\`\`json
{
  "businessName": "Nome do Negócio",
  "niche": "${effectiveNiche}",
  "tagline": "Slogan de alto impacto e autoridade",
  "description": "Apresentação da experiência de atendimento",
  "whatsapp": "5511999999999",
  "address": "Endereço do estabelecimento",
  "openingHours": "Segunda a Sábado das 09h às 19h",
  "instagram": "@perfil",
  "themeStyle": "modern-slate",
  "accentColor": "violet",
  "professionals": [
    { "id": "prof-1", "name": "Especialista Principal", "role": "Atendimento Especializado (${effectiveNiche})" }
  ],
  "services": [
    {
      "id": "srv-1",
      "name": "Serviço Principal (${effectiveNiche})",
      "description": "Descrição clara do serviço com foco nos benefícios e resultados para o cliente.",
      "durationMinutes": 45,
      "price": 100.0,
      "category": "Principal",
      "badge": "Mais Procurado ⭐",
      "popular": true
    },
    {
      "id": "srv-2",
      "name": "Atendimento Personalizado",
      "description": "Sessão dedicada com acompanhamento completo e materiais de qualidade.",
      "durationMinutes": 60,
      "price": 150.0,
      "category": "Especialidades",
      "badge": "Destaque",
      "popular": false
    }
  ]
}
\`\`\`

Regras:
- Gere serviços, categorias e profissionais estritamente pertinentes ao nicho "${effectiveNiche}".
- Temas válidos para themeStyle: "modern-slate", "clean-aesthetic", "luxury-gold", "dark-barber".
- Cores válidas para accentColor: "violet", "emerald", "rose", "sky", "amber", "gold".
- Mantenha sempre a conversa envolvente na primeira parte da resposta e o JSON atualizado na segunda parte.`;
}

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

  let rawText = "";
  const systemPrompt = buildAgendaAiSystemPrompt(currentAgenda?.niche || "geral");
  const agendaModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"] as const;

  for (const modelToTry of agendaModels) {
    if (rawText) break;
    try {
      const res = await ai.models.generateContent({
        model: modelToTry,
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
        },
      });
      rawText = res.text?.trim() || "";
    } catch (err) {
      console.warn(`[AgendaAiService] Falha com ${modelToTry}:`, err);
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

