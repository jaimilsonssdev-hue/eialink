/**
 * Serviço de Geração de Imagens por IA com Limite Estrito (Máximo 3 fotos por página/cliente)
 * Evita explosão de custos de API e garante controle financeiro rígido.
 */

export const MAX_AI_IMAGES_PER_PAGE = 3;

export interface AiImageGenerationResult {
  url: string;
  remainingQuota: number;
}

const NICHE_PROMPTS: Record<string, string> = {
  loja: "modern boutique retail store entrance with high end clothes display, brazilian commercial aesthetic, warm natural lighting, 4k architectural photography",
  delivery: "delicious gourmet burger with melted cheddar and fries, delivery paper bag, brazilian artisan snack food, professional appetizing food photography",
  restaurante: "elegant contemporary restaurant interior dining room, cozy ambient warm lighting, wine glasses on tables, fine dining brazilian bistro",
  sorveteria: "artisan gelato ice cream display counter and acai bowl with fresh strawberries, colorful bright refreshing gelateria interior",
  oficina: "clean professional auto repair shop and tire service center, modern vehicle on lift, high-tech automotive workshop Brazil",
  clinica: "modern clean medical clinic reception and doctor consultation office, welcoming soothing healthcare interior design",
  psicologia: "warm comforting psychology therapy office with comfortable armchair and green indoor plants, soft natural light mental wellness",
  petshop: "charming pet shop groomer and veterinary clinic with pet food bags and happy dog, clean bright brazilian pet boutique",
  advocacia: "prestigious corporate law firm meeting room, dark wood table, scales of justice, sophisticated modern legal office",
  odontologia: "state of the art dental clinic chair and equipment, bright immaculate clean aesthetic dentistry clinic",
  construcao: "modern residential architectural house under construction renovation, high-end finishing materials and engineering plan",
  imobiliaria: "luxury modern residential house facade with swimming pool and landscaped garden, contemporary real estate Brazil",
  seguros: "happy smiling brazilian family in cozy modern home living room, safety security and protection concept photography",
  autonomo: "neatly organized professional technician tool kit and precision diagnostics equipment on workbench, clean tradesman aesthetic",
  pessoal: "minimalist creative home office desk setup with laptop, coffee cup and clean notebook, modern creator workspace",
  fitness: "high-performance fitness gym with dumbbells rack, led modern lighting and workout equipment, premium training studio",
  nutricao: "fresh vibrant salad bowl with avocado, greens, fruits and measuring tape on wooden nutritionist desk, healthy eating concept",
  costura: "vintage sewing machine with colorful thread spools, measuring tape and tailor mannequin in elegant fashion atelier",
  tecnologia: "modern computer hardware repair workbench with circuit boards, precision screwdrivers and monitors, high-tech IT support",
  geral: "modern contemporary commercial office facade and reception desk, premium professional corporate photography",
};

/**
 * Retorna o número de imagens de IA já geradas para a página
 */
export function getAiImageUsageCount(socialLinks?: Record<string, any> | null): number {
  if (!socialLinks || typeof socialLinks !== "object") return 0;
  return Number(socialLinks.ai_images_count) || 0;
}

/**
 * Retorna a cota restante de geração por IA
 */
export function getRemainingAiQuota(socialLinks?: Record<string, any> | null): number {
  const used = getAiImageUsageCount(socialLinks);
  return Math.max(0, MAX_AI_IMAGES_PER_PAGE - used);
}

/**
 * Gera uma foto de alta resolução por IA contextualizada no nicho da empresa,
 * respeitando estritamente o limite de 3 imagens por página.
 */
export async function generateAiImage(params: {
  niche: string;
  companyName: string;
  currentUsageCount: number;
  type?: "cover" | "avatar" | "product";
}): Promise<AiImageGenerationResult> {
  if (params.currentUsageCount >= MAX_AI_IMAGES_PER_PAGE) {
    throw new Error(
      `Limite atingido: você já gerou o máximo de ${MAX_AI_IMAGES_PER_PAGE} fotos por IA para esta página.`
    );
  }

  const basePrompt = NICHE_PROMPTS[params.niche] || NICHE_PROMPTS.geral;
  const seed = Math.floor(Math.random() * 100000);
  const encodedPrompt = encodeURIComponent(`${basePrompt}, high commercial quality, realistic, no text watermark`);

  // Gera via motor Pollinations AI de alta qualidade e resposta instantânea
  const width = params.type === "cover" ? 1200 : params.type === "avatar" ? 400 : 800;
  const height = params.type === "cover" ? 500 : params.type === "avatar" ? 400 : 600;

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  return {
    url: imageUrl,
    remainingQuota: MAX_AI_IMAGES_PER_PAGE - (params.currentUsageCount + 1),
  };
}
