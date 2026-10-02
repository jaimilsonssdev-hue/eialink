/**
 * Serviço de Geração de Imagens por IA de Extrema Qualidade e Realismo Comercial.
 * Utiliza o modelo Flux.1 (Black Forest Labs) com engenharia de prompts premiada
 * e limite estrito de até 3 fotos por página para controle financeiro e performance.
 */

export const MAX_AI_IMAGES_PER_PAGE = 3;

export interface AiImageGenerationResult {
  url: string;
  remainingQuota: number;
}

const NICHE_PROMPTS: Record<string, string> = {
  loja: "luxurious modern boutique retail store entrance with elegant clothes display, warm architectural lighting, marble floor, high-end commercial Brazilian boutique",
  delivery: "mouth-watering artisan gourmet burger with melting aged cheddar, crispy bacon and golden rustic fries, takeaway craft paper bag, dark moody lighting",
  restaurante: "elegant fine dining restaurant interior, beautifully laid wooden tables with wine glasses, warm ambient candle lighting, cozy contemporary bistro",
  sorveteria: "artisan Italian gelato display with rich pistachio, chocolate and berry flavors, fresh fruit toppings, bright modern ice cream parlor",
  hamburgueria: "gourmet smash burger with double beef patty, melting cheddar cheese, caramelized onions and crispy smoked bacon, rustic wooden table, dark background",
  pizzaria: "authentic artisanal wood-fired pizza with bubbling buffalo mozzarella, fresh basil and ripe san marzano tomatoes, rustic stone oven with golden fire in background",
  confeitaria: "charming artisanal pastry showcase filled with delicate fruit tarts, macarons, chocolate cakes, warm ambient Parisian style bakery",
  cafeteria: "cozy artisanal specialty coffee shop with barista espresso machine, cup of cappuccino with delicate latte art on rustic wooden table, morning sun rays",
  oficina: "spotless high-tech modern auto repair workshop, luxury car lifted on hydraulic lift, organized tool chest, clean epoxy floor, bright workshop lighting",
  clinica: "immaculate modern healthcare medical clinic consultation office, comfortable designer chairs, soft welcoming lighting, peaceful mental wellness atmosphere",
  psicologia: "warm comforting psychology therapy office with deep comfortable armchair, green indoor plants, warm beige tones, serene natural morning daylight",
  beleza: "high-end luxury beauty salon with illuminated vanity mirrors, comfortable styling chairs, sleek minimalist interior design, Brazilian aesthetic",
  estetica_corporal: "luxury aesthetic body clinic with modern massage table, white fluffy towels, hot basalt massage stones, soothing ambient spa lighting, serene wellness",
  estetica_facial: "modern clinical facial skincare room, high-tech beauty equipment, immaculate clean treatment bed, magnifying lamp, medical aesthetic clinic",
  spa: "luxurious tranquil day spa with warm timber elements, glowing candles, indoor bamboo plants, relaxation massage bed, calming zen atmosphere",
  barbearia: "classic vintage gentlemen barbershop with dark leather barber chairs, brass accents, illuminated mirrors, professional grooming tools and pomades",
  petshop: "delightful modern pet grooming boutique and vet clinic, clean bright interior, happy golden retriever being pampered, organic pet food shelves",
  advocacia: "prestigious corporate law firm boardroom with polished dark mahogany conference table, law books, balance scale of justice, panoramic city skyline view",
  odontologia: "state-of-the-art dental clinic with ultra-modern ergonomic dental chair, spotless clinic room, digital monitors, soft warm clinical lighting",
  construcao: "striking contemporary residential architectural house under construction renovation, high-end concrete and wood finishes, architectural blueprint plan",
  imobiliaria: "luxury modern residential architectural house facade with infinity swimming pool, glass walls, landscaped garden, dusk sunset illumination",
  seguros: "happy Brazilian family smiling together in bright sunlit modern home living room, feeling safe and protected, warm natural photography",
  autonomo: "neatly arranged high-end professional technician tool kit and precision diagnostic instruments on clean workbench, craftsman pride",
  pessoal: "minimalist creative home workspace desk setup with ultra-thin laptop, warm cup of coffee, clean notebook, soothing daylight",
  fitness: "high-performance boutique fitness gym studio with matte black dumbbells rack, neon LED accents, clean wooden floor, elite training equipment",
  nutricao: "vibrant fresh Mediterranean nutrition bowl with avocado, salmon, microgreens, quinoa and citrus slices on wooden table with measuring tape",
  costura: "high-fashion atelier design studio with tailor dressmaker mannequin, colorful silk fabrics, vintage sewing machine and measuring tape",
  tecnologia: "clean futuristic IT computer workstation with high-end dual monitors showing code, mechanical keyboard, soft ambient desk lighting",
  farmacia: "modern bright compounding pharmacy and health store with organized minimalist wooden shelves and natural wellness products",
  contabilidade: "executive financial accounting desk with sleek laptop showing analytics charts, financial reports, metallic pen, modern corporate office",
  consultoria: "executive corporate boardroom with glass whiteboard, business charts, leather armchairs, panoramic metropolis view, strategic consulting",
  educacao: "inspiring contemporary educational classroom and study space with ergonomic desks, books and warm daylight, creative learning environment",
  energia_solar: "sleek modern rooftop with photovoltaic solar panels absorbing golden sunlight, clean energy future, clear blue sky",
  bebidas: "upscale wine cellar and craft beer distributor with wooden racks of vintage wine bottles, cold beer taps, warm industrial ambiance",
  marketing: "modern creative digital marketing agency studio with large screens displaying analytics dashboards, modern creative team workspace",
  geral: "contemporary commercial office facade and elegant reception desk, warm architectural lighting, professional corporate photography",
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
 * Gera uma foto de altíssima definição por IA contextualizada no nicho da empresa,
 * utilizando o motor Flux.1 com renderização foto-realista comercial 8K,
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

  const cleanNiche = (params.niche || "geral").toLowerCase().trim();
  const baseNichePrompt = NICHE_PROMPTS[cleanNiche] || NICHE_PROMPTS.geral;
  const companyContext = params.companyName ? `for ${params.companyName}` : "";

  let promptText = "";

  if (params.type === "product") {
    const itemContext = params.itemName || "commercial menu item";
    const detailContext = params.details ? `, ${params.details}` : "";
    promptText = `award-winning commercial studio product photography, 8k resolution, ${itemContext} ${companyContext}${detailContext}, appetizing and mouthwatering presentation, softbox professional studio lighting, macro lens razor sharp focus, Canon EOS R5, hyperrealistic textures, clean elegant depth of field, masterwork, no watermark, no text, no logo, no blurry artifacts`;
  } else if (params.type === "cover") {
    promptText = `award-winning commercial architectural photography, 8k resolution, ultra-photorealistic, ${baseNichePrompt} ${companyContext}, wide angle 16:9 cinematic shot, Sony A7R IV 35mm f/1.8 lens, golden hour natural ambient lighting, razor sharp focus, vibrant natural colors, ultra-detailed texture, depth of field, commercial advertisement standard, masterwork, no watermark, no logo, no blurry artifacts, no deformed details, no text`;
  } else {
    // avatar / emblem / portrait
    promptText = `professional commercial portrait or luxury brand business emblem, 8k resolution, ${baseNichePrompt} ${companyContext}, Hasselblad H6D-100c studio lighting, razor sharp focus, clean elegant background, hyperrealistic, masterwork, no watermark, no text, no logo`;
  }

  const seed = Math.floor(Math.random() * 999999);
  const encodedPrompt = encodeURIComponent(promptText);

  // Dimensões ideais para cada tipo de enquadramento
  const width = params.type === "cover" ? 1200 : params.type === "avatar" ? 512 : 800;
  const height = params.type === "cover" ? 675 : params.type === "avatar" ? 512 : 600;

  // Endpoint do Flux.1 de altíssima definição sem logos
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

  return {
    url: imageUrl,
    remainingQuota: MAX_AI_IMAGES_PER_PAGE - (params.currentUsageCount + 1),
  };
}
