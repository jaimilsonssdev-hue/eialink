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
  hamburgueria: "artisan smash burger with crispy bacon and melted cheddar, golden fries on slate board, moody dark wood pub background, delicious food photography",
  pizzaria: "authentic wood-fired pizza with bubbling mozzarella and fresh basil leaves, rustic pizzeria oven in background, gourmet food photography",
  confeitaria: "artisanal pastry showcase with colorful macarons, decorated celebration cakes and desserts, bright charming bakery interior",
  cafeteria: "cozy specialty coffee shop with espresso machine, latte art in ceramic cup, wooden tables and warm ambient lighting, artisanal cafe aesthetic",
  oficina: "clean professional auto repair shop and tire service center, modern vehicle on lift, high-tech automotive workshop Brazil",
  clinica: "modern clean medical clinic reception and doctor consultation office, welcoming soothing healthcare interior design",
  psicologia: "warm comforting psychology therapy office with comfortable armchair and green indoor plants, soft natural light mental wellness",
  beleza: "luxurious modern beauty salon and aesthetic spa, clean elegant mirrors, hair styling station, soothing ambient lighting, Brazilian aesthetic",
  barbearia: "classic vintage barbershop interior with leather barber chairs, grooming products, warm ambient lighting, stylish wood trim",
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
  farmacia: "modern bright compounding pharmacy and health store interior with organized shelves and healthcare wellness products",
  contabilidade: "executive financial consulting desk with financial charts, calculator, sleek laptop and coffee cup, professional corporate accounting",
  consultoria: "modern business strategy meeting room with glass whiteboard, sleek conference table, panoramic city view, professional consulting",
  educacao: "contemporary educational classroom and study space with modern desks, books and warm daylight, inspiring learning environment",
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
  itemName?: string;
  details?: string;
}): Promise<AiImageGenerationResult> {
  if (params.currentUsageCount >= MAX_AI_IMAGES_PER_PAGE) {
    throw new Error(
      `Limite atingido: você já gerou o máximo de ${MAX_AI_IMAGES_PER_PAGE} fotos por IA para esta página.`
    );
  }

  let promptText = "";
  if (params.type === "product") {
    const itemContext = params.itemName || "product item";
    const companyContext = params.companyName ? `for ${params.companyName}` : "";
    const detailContext = params.details ? `, ${params.details}` : "";
    promptText = `${itemContext} ${companyContext}${detailContext}, commercial studio product photography, clean background, appetizing and appealing presentation, sharp focus, professional lighting, 4k ultra realistic, no watermark, no text`;
  } else if (params.type === "cover") {
    const basePrompt = NICHE_PROMPTS[params.niche] || NICHE_PROMPTS.geral;
    const companyContext = params.companyName ? `, representing ${params.companyName} business in Brazil` : "";
    promptText = `${basePrompt}${companyContext}, cinematic wide angle, professional commercial photography, inviting atmosphere, warm natural lighting, 4k high resolution, no text, no watermark`;
  } else {
    const basePrompt = NICHE_PROMPTS[params.niche] || NICHE_PROMPTS.geral;
    promptText = `${basePrompt}, professional commercial photo, sharp focus, 4k, no text, no watermark`;
  }

  const seed = Math.floor(Math.random() * 100000);
  const encodedPrompt = encodeURIComponent(promptText);

  // Gera via motor Pollinations AI de alta qualidade e resposta instantânea
  const width = params.type === "cover" ? 1200 : params.type === "avatar" ? 400 : 800;
  const height = params.type === "cover" ? 500 : params.type === "avatar" ? 400 : 600;

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  return {
    url: imageUrl,
    remainingQuota: MAX_AI_IMAGES_PER_PAGE - (params.currentUsageCount + 1),
  };
}

