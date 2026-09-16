/**
 * Gerador de Gráficos e Imagens em HTML/SVG Nativo (Custo R$ 0,00 e 100% Vetorial)
 * Produz capas e avatares diretamente em Data-URI SVG, eliminando a dependência
 * de bancos de imagens genéricos com modelos estrangeiros ou fotos fora de contexto.
 */

interface NicheVisualConfig {
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  accent: string;
  symbolSvg: string;
  label: string;
}

const NICHE_VISUALS: Record<string, NicheVisualConfig> = {
  loja: {
    gradientStart: "#1e1b4b",
    gradientMid: "#4338ca",
    gradientEnd: "#065f46",
    accent: "#34d399",
    symbolSvg: `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
    label: "Loja & Catálogo Oficial",
  },
  delivery: {
    gradientStart: "#450a0a",
    gradientMid: "#b91c1c",
    gradientEnd: "#d97706",
    accent: "#fbbf24",
    symbolSvg: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    label: "Delivery Rápido & Pedidos",
  },
  restaurante: {
    gradientStart: "#1c1917",
    gradientMid: "#78350f",
    gradientEnd: "#991b1b",
    accent: "#f59e0b",
    symbolSvg: `<path d="M18 2v20M6 2v20M2 7h8a4 4 0 0 0 4-4M18 15a4 4 0 0 0 4-4"/>`,
    label: "Gastronomia & Experiência",
  },
  sorveteria: {
    gradientStart: "#083344",
    gradientMid: "#0284c7",
    gradientEnd: "#db2777",
    accent: "#38bdf8",
    symbolSvg: `<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`,
    label: "Gelateria & Açaí Artesanal",
  },
  bebidas: {
    gradientStart: "#1a0b02",
    gradientMid: "#78350f",
    gradientEnd: "#d97706",
    accent: "#fbbf24",
    symbolSvg: `<path d="M18 2h-6a2 2 0 0 0-2 2v2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM8 6h2v12H8V6z"/>`,
    label: "Adega, Bebidas & Distribuidora",
  },
  barbearia: {
    gradientStart: "#09090b",
    gradientMid: "#18181b",
    gradientEnd: "#78350f",
    accent: "#f59e0b",
    symbolSvg: `<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>`,
    label: "Barbearia & Barber Club",
  },
  beleza: {
    gradientStart: "#3b0764",
    gradientMid: "#831843",
    gradientEnd: "#be185d",
    accent: "#f472b6",
    symbolSvg: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    label: "Studio de Beleza & Estética",
  },
  oficina: {
    gradientStart: "#0f172a",
    gradientMid: "#1e293b",
    gradientEnd: "#c2410c",
    accent: "#f97316",
    symbolSvg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    label: "Auto Center & Mecânica",
  },
  clinica: {
    gradientStart: "#042f2e",
    gradientMid: "#0f766e",
    gradientEnd: "#0284c7",
    accent: "#2dd4bf",
    symbolSvg: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`,
    label: "Saúde & Atendimento Médico",
  },
  psicologia: {
    gradientStart: "#064e3b",
    gradientMid: "#047857",
    gradientEnd: "#0f766e",
    accent: "#6ee7b7",
    symbolSvg: `<path d="M12 2a10 10 0 0 0-7.5 16.6l.5.5V22l3.4-1.7c1.1.4 2.3.7 3.6.7a10 10 0 0 0 0-20z"/>`,
    label: "Terapia & Acolhimento Emocional",
  },
  petshop: {
    gradientStart: "#14532d",
    gradientMid: "#15803d",
    gradientEnd: "#b45309",
    accent: "#facc15",
    symbolSvg: `<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3a5 5 0 0 1 5-5z"/>`,
    label: "Pet Shop & Cuidado Animal",
  },
  advocacia: {
    gradientStart: "#09090b",
    gradientMid: "#18181b",
    gradientEnd: "#3b0764",
    accent: "#fbbf24",
    symbolSvg: `<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>`,
    label: "Advocacia & Assessoria Jurídica",
  },
  odontologia: {
    gradientStart: "#082f49",
    gradientMid: "#0284c7",
    gradientEnd: "#0f766e",
    accent: "#38bdf8",
    symbolSvg: `<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>`,
    label: "Odontologia & Estética Dental",
  },
  construcao: {
    gradientStart: "#1c1917",
    gradientMid: "#44403c",
    gradientEnd: "#9a3412",
    accent: "#fb923c",
    symbolSvg: `<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>`,
    label: "Construção Civil & Reformas",
  },
  imobiliaria: {
    gradientStart: "#0f172a",
    gradientMid: "#1e3a8a",
    gradientEnd: "#0369a1",
    accent: "#60a5fa",
    symbolSvg: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    label: "Imóveis & Condomínios",
  },
  seguros: {
    gradientStart: "#022c22",
    gradientMid: "#065f46",
    gradientEnd: "#1e3a8a",
    accent: "#34d399",
    symbolSvg: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>`,
    label: "Corretora de Seguros & Proteção",
  },
  autonomo: {
    gradientStart: "#18181b",
    gradientMid: "#27272a",
    gradientEnd: "#3f3f46",
    accent: "#a1a1aa",
    symbolSvg: `<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
    label: "Serviços Técnicos & Autônomo",
  },
  pessoal: {
    gradientStart: "#18181b",
    gradientMid: "#312e81",
    gradientEnd: "#581c87",
    accent: "#c084fc",
    symbolSvg: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    label: "Página Pessoal & Portfólio",
  },
  fitness: {
    gradientStart: "#18181b",
    gradientMid: "#7f1d1d",
    gradientEnd: "#991b1b",
    accent: "#ef4444",
    symbolSvg: `<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>`,
    label: "Fitness, Treino & Performance",
  },
  nutricao: {
    gradientStart: "#052e16",
    gradientMid: "#166534",
    gradientEnd: "#047857",
    accent: "#86efac",
    symbolSvg: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`,
    label: "Nutrição & Saúde Alimentar",
  },
  costura: {
    gradientStart: "#2e1065",
    gradientMid: "#581c87",
    gradientEnd: "#831843",
    accent: "#f472b6",
    symbolSvg: `<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>`,
    label: "Ateliê & Moda Sob Medida",
  },
  tecnologia: {
    gradientStart: "#030712",
    gradientMid: "#111827",
    gradientEnd: "#1e1b4b",
    accent: "#38bdf8",
    symbolSvg: `<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
    label: "Tecnologia & Suporte Digital",
  },
  marketing: {
    gradientStart: "#0b0f19",
    gradientMid: "#1e1b4b",
    gradientEnd: "#4338ca",
    accent: "#818cf8",
    symbolSvg: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><path d="M4 14v7"/><path d="M20 14v7"/><line x1="4" y1="18" x2="20" y2="18"/>`,
    label: "Marketing Digital & Performance",
  },
  contabilidade: {
    gradientStart: "#0b1120",
    gradientMid: "#1e293b",
    gradientEnd: "#0f766e",
    accent: "#38bdf8",
    symbolSvg: `<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h6"/>`,
    label: "Contabilidade & Gestão Fiscal",
  },
  energia_solar: {
    gradientStart: "#0f172a",
    gradientMid: "#78350f",
    gradientEnd: "#b45309",
    accent: "#fbbf24",
    symbolSvg: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
    label: "Engenharia & Energia Solar",
  },
  geral: {
    gradientStart: "#09090b",
    gradientMid: "#1e293b",
    gradientEnd: "#172554",
    accent: "#60a5fa",
    symbolSvg: `<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
    label: "Empresa Verificada",
  },
};

/**
 * Escapa texto para inserção segura em XML/SVG
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Gera uma Capa Mesh Gradient temática em SVG puro
 */
export function generateSvgCover(niche: string, companyName: string): string {
  const config = NICHE_VISUALS[niche] || NICHE_VISUALS.geral;
  const safeName = escapeXml(companyName || "Nossa Empresa");
  const safeLabel = escapeXml(config.label);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.gradientStart}"/>
      <stop offset="50%" stop-color="${config.gradientMid}"/>
      <stop offset="100%" stop-color="${config.gradientEnd}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="20%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${config.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${config.gradientStart}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="85%" cy="70%" r="50%">
      <stop offset="0%" stop-color="${config.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${config.gradientEnd}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.75" stroke-opacity="0.04"/>
    </pattern>
  </defs>

  <!-- Fundo com gradiente mesh e textura geométrica -->
  <rect width="1200" height="480" fill="url(#bgGrad)"/>
  <rect width="1200" height="480" fill="url(#glow1)"/>
  <rect width="1200" height="480" fill="url(#glow2)"/>
  <rect width="1200" height="480" fill="url(#gridPattern)"/>

  <!-- Linhas de iluminação sutis -->
  <path d="M -100 240 Q 400 80 1300 380" fill="none" stroke="${config.accent}" stroke-width="1.5" stroke-opacity="0.25"/>
  <path d="M -50 380 Q 600 440 1250 120" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.12"/>

  <!-- Badge Institucional superior direito -->
  <g transform="translate(940, 36)">
    <rect width="220" height="38" rx="19" fill="#000000" fill-opacity="0.4" stroke="${config.accent}" stroke-width="1" stroke-opacity="0.5"/>
    <circle cx="24" cy="19" r="5" fill="#10b981"/>
    <text x="38" y="24" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="600" letter-spacing="0.5">ATENDIMENTO OFICIAL</text>
  </g>

  <!-- Tipografia de Autoridade Central -->
  <g transform="translate(80, 260)">
    <text x="0" y="0" fill="${config.accent}" font-family="system-ui, sans-serif" font-size="15" font-weight="800" letter-spacing="2" text-transform="uppercase">${safeLabel}</text>
    <text x="0" y="55" fill="#ffffff" font-family="system-ui, sans-serif" font-size="44" font-weight="900" letter-spacing="-1">${safeName}</text>
    <text x="0" y="90" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="16" font-weight="400">Padrão de Excelência &bull; Atendimento Prioritário</text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Gera um Avatar Monograma estilizado em SVG puro
 */
export function generateSvgAvatar(companyName: string, niche: string): string {
  const config = NICHE_VISUALS[niche] || NICHE_VISUALS.geral;
  const initials = (companyName || "NE")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.gradientStart}"/>
      <stop offset="50%" stop-color="${config.gradientMid}"/>
      <stop offset="100%" stop-color="${config.gradientEnd}"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.accent}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>

  <!-- Fundo com anel metalizado duplo -->
  <circle cx="120" cy="120" r="116" fill="url(#avatarGrad)"/>
  <circle cx="120" cy="120" r="110" fill="none" stroke="url(#ringGrad)" stroke-width="3" stroke-opacity="0.85"/>
  <circle cx="120" cy="120" r="102" fill="#000000" fill-opacity="0.25"/>

  <!-- Monograma de Letras -->
  <text x="120" y="132" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" letter-spacing="1" text-anchor="middle" dominant-baseline="central">
    ${escapeXml(initials)}
  </text>

  <!-- Badge inferior verificado -->
  <g transform="translate(85, 175)">
    <rect width="70" height="22" rx="11" fill="#000000" fill-opacity="0.75" stroke="${config.accent}" stroke-width="1"/>
    <text x="35" y="15" fill="${config.accent}" font-family="system-ui, sans-serif" font-size="9.5" font-weight="800" text-anchor="middle" letter-spacing="1">OFICIAL</text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

