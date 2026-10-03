export type LoyaltyTierName = "Bronze" | "Prata" | "Ouro" | "Diamante";

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  badge?: string;
  imageUrl?: string;
}

export interface LoyaltyTier {
  name: LoyaltyTierName;
  minPoints: number;
  perk: string;
  color: string;
}

export interface LoyaltyMission {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  actionType: "google_review" | "instagram_story" | "weekday_visit" | "checkin" | "custom";
  actionUrl?: string;
  badge?: string;
}

export interface LoyaltyProgramSettings {
  businessPageId: string;
  isActive: boolean;
  pointsRatio: number; // Ex: 1 = R$ 1,00 gasto dá 1 Ponto
  pointsExpirationDays: number; // Ex: 180 dias
  allowThermalPrint: boolean;
  rewards: LoyaltyReward[];
  tiers: LoyaltyTier[];
  missions: LoyaltyMission[];
  updatedAt?: string;
}

export interface LoyaltyCustomerBalance {
  customerWhatsapp: string;
  customerName?: string;
  currentPoints: number;
  totalEarnedPoints: number;
  currentTier: LoyaltyTierName;
  expiresAt: string;
  lastVisit: string;
}

export interface LoyaltyPointToken {
  tokenId: string;
  businessPageId: string;
  businessName: string;
  points: number;
  purchaseAmount?: number;
  source: "purchase" | "mission" | "thermal_receipt" | "cashier";
  description?: string;
  createdAt: string;
  expiresAt: string;
  isRedeemed: boolean;
  redeemedByWhatsapp?: string;
  redeemedByName?: string;
  redeemedAt?: string;
}

export interface LoyaltyVoucher {
  voucherCode: string;
  rewardId: string;
  rewardTitle: string;
  pointsDeducted: number;
  businessPageId: string;
  customerWhatsapp: string;
  customerName?: string;
  createdAt: string;
  expiresAt: string;
  isClaimed: boolean;
}

export const DEFAULT_LOYALTY_TIERS: LoyaltyTier[] = [
  { name: "Bronze", minPoints: 0, perk: "Acesso ao catálogo de recompensas", color: "#cd7f32" },
  { name: "Prata", minPoints: 150, perk: "5% de bônus em todos os pontos acumulados", color: "#94a3b8" },
  { name: "Ouro", minPoints: 400, perk: "Sobremesa ou mimo de cortesia em toda visita", color: "#f59e0b" },
  { name: "Diamante", minPoints: 1000, perk: "Atendimento VIP exclusivo sem fila e mesa reservada", color: "#38bdf8" },
];

export const DEFAULT_LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: "rew-1",
    title: "Bebida ou Café Especial",
    description: "Refrigerante lata, suco natural ou café barista à sua escolha.",
    pointsCost: 50,
    badge: "Mais Fácil",
  },
  {
    id: "rew-2",
    title: "Sobremesa da Casa",
    description: "Deliciosa sobremesa artesanal ou porção especial do cardápio.",
    pointsCost: 120,
    badge: "Destaque",
  },
  {
    id: "rew-3",
    title: "Prato Principal ou Pizza Tradicional",
    description: "Um prato principal individual ou pizza clássica do cardápio.",
    pointsCost: 250,
    badge: "Super Prêmio",
  },
];

export const DEFAULT_LOYALTY_MISSIONS: LoyaltyMission[] = [
  {
    id: "mis-1",
    title: "Avaliação 5 Estrelas no Google",
    description: "Conte como foi sua experiência no Google Maps e ganhe pontos na hora.",
    pointsReward: 30,
    actionType: "google_review",
    badge: "⭐ Avaliação",
  },
  {
    id: "mis-2",
    title: "Post nos Stories marcando nosso @",
    description: "Poste um Story saboreando nosso prato e marque o Instagram oficial.",
    pointsReward: 50,
    actionType: "instagram_story",
    badge: "📸 Instagram",
  },
  {
    id: "mis-3",
    title: "Visita em Dias Especiais",
    description: "Consuma às terças ou quartas-feiras e ganhe pontos adicionais.",
    pointsReward: 20,
    actionType: "weekday_visit",
    badge: "⚡ Terça & Quarta",
  },
];
