export type ProspectStatus =
  | "novo"
  | "contatado"
  | "respondeu"
  | "reuniao"
  | "proposta"
  | "cliente"
  | "descartado";

export type ProspectPriority = "alta" | "media" | "baixa";

export type ProspectChannel =
  | "whatsapp"
  | "instagram"
  | "email"
  | "telefone"
  | "presencial"
  | "outro";

export type ProspectOutcome =
  | "enviado"
  | "respondeu"
  | "sem_resposta"
  | "agendou"
  | "fechou"
  | "descartado";

export type ProspectedCompany = {
  id: string;
  name: string;
  niche: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  has_website: boolean;
  rating: number | null;
  reviews_count: number | null;
  source: string;
  score: number;
  priority: ProspectPriority;
  status: ProspectStatus;
  notes: string | null;
  dedupe_key: string;
  last_contacted_at: string | null;
  next_action_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProspectDraft = Omit<
  ProspectedCompany,
  "id" | "created_at" | "updated_at" | "created_by" | "last_contacted_at" | "next_action_at"
>;

export type ProspectingActivity = {
  id: string;
  company_id: string;
  admin_id: string;
  channel: ProspectChannel;
  outcome: ProspectOutcome;
  message: string | null;
  notes: string | null;
  created_at: string;
};

export const STATUS_LABEL: Record<ProspectStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  reuniao: "Reunião",
  proposta: "Proposta",
  cliente: "Cliente",
  descartado: "Descartado",
};

export const PRIORITY_LABEL: Record<ProspectPriority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const CHANNEL_LABEL: Record<ProspectChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "E-mail",
  telefone: "Telefone",
  presencial: "Presencial",
  outro: "Outro",
};

export const OUTCOME_LABEL: Record<ProspectOutcome, string> = {
  enviado: "Abordagem enviada",
  respondeu: "Respondeu",
  sem_resposta: "Sem resposta",
  agendou: "Agendou reunião",
  fechou: "Fechou negócio",
  descartado: "Descartado",
};
