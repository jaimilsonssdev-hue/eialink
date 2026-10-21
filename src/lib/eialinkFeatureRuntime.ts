export interface EiaLinkFeatureFlags {
  agenda_enabled?: boolean;
  ai_concierge_enabled?: boolean;
  deals_enabled?: boolean;
  loyalty_enabled?: boolean;
  gps_enabled?: boolean;
  whatsapp_enabled?: boolean;
}

export interface FeatureRuntimeContext {
  slug?: string;
  businessName?: string;
  whatsapp?: string;
  address?: string;
  niche?: string;
  features?: EiaLinkFeatureFlags;
}

interface RuntimeNichePack {
  category: string;
  ctaLabel: string;
  isBooking: boolean;
  services: Array<{ name: string; price: string; duration: string; desc: string }>;
  deal: {
    title: string;
    description: string;
    originalPrice: string;
    dealPrice: string;
    badge: string;
    codePrefix: string;
    remaining: number;
  };
  loyaltyRewards: Array<{ id: string; title: string; points: number; desc: string }>;
}

function getRuntimeNichePack(niche?: string, businessName?: string): RuntimeNichePack {
  const text = `${niche || ""} ${businessName || ""}`.toLowerCase();

  if (
    /odonto|dent|sorriso|cl[ií]nica|m[eé]dic|pediatr|oftalmo|fisioter|psic[oó]l|terapeuta|nutri|sa[uú]de|ortoped|dermatolog/i.test(
      text,
    )
  ) {
    return {
      category: "healthcare",
      ctaLabel: "🗓️ Agendar Consulta",
      isBooking: true,
      services: [
        {
          name: "Avaliação & Check-up Inicial",
          price: "Cortesia",
          duration: "30 min",
          desc: "Diagnóstico completo e plano de tratamento.",
        },
        {
          name: "Limpeza & Profilaxia Profunda",
          price: "R$ 150",
          duration: "45 min",
          desc: "Remoção de tártaro, jato de bicarbonato e flúor.",
        },
        {
          name: "Clareamento Dental / Estética",
          price: "R$ 650",
          duration: "60 min",
          desc: "Tecnologia avançada para renovar seu sorriso.",
        },
        {
          name: "Restauração Estética Premium",
          price: "R$ 180",
          duration: "45 min",
          desc: "Materiais de alta durabilidade e acabamento natural.",
        },
      ],
      deal: {
        title: "Check-up Completo + Profilaxia com 35% OFF",
        description:
          "Avaliação detalhada + limpeza completa com aplicação de flúor e polimento para novos agendamentos pelo site.",
        originalPrice: "R$ 230,00",
        dealPrice: "R$ 149,90",
        badge: "35% OFF HOJE",
        codePrefix: "SORRISO35",
        remaining: 6,
      },
      loyaltyRewards: [
        {
          id: "r1",
          title: "Kit Higiene VIP + Escova Premium",
          points: 100,
          desc: "Retire na recepção em sua próxima consulta.",
        },
        {
          id: "r2",
          title: "50% OFF na Limpeza & Profilaxia",
          points: 200,
          desc: "Desconto exclusivo para membros do Clube VIP.",
        },
        {
          id: "r3",
          title: "Sessão de Clareamento / Estética Bônus",
          points: 400,
          desc: "Recompensa máxima para pacientes fiéis.",
        },
      ],
    };
  }

  if (/barbea|barbeir|barber|navalha|\bbarba\b|degrad[eê]|\bfade\b/i.test(text)) {
    return {
      category: "barber",
      ctaLabel: "🗓️ Agendar Horário",
      isBooking: true,
      services: [
        {
          name: "Corte Degradê / Social",
          price: "R$ 45",
          duration: "40 min",
          desc: "Corte na tesoura e máquina com finalização.",
        },
        {
          name: "Barboterapia na Toalha Quente",
          price: "R$ 35",
          duration: "30 min",
          desc: "Vapor de ozônio, hidratação e navalha.",
        },
        {
          name: "Combo Cabelo + Barba VIP",
          price: "R$ 70",
          duration: "60 min",
          desc: "Pacote completo com bebida de cortesia.",
        },
        {
          name: "Acabamento & Sobrancelha",
          price: "R$ 20",
          duration: "20 min",
          desc: "Alinhamento perfeito na navalha.",
        },
      ],
      deal: {
        title: "Combo Corte + Barboterapia + Sobrancelha",
        description:
          "Visual completo na toalha quente + bebida gelada de cortesia para agendamentos feitos hoje.",
        originalPrice: "R$ 90,00",
        dealPrice: "R$ 64,90",
        badge: "28% OFF",
        codePrefix: "BARBERVIP",
        remaining: 5,
      },
      loyaltyRewards: [
        {
          id: "r1",
          title: "Sobrancelha + Acabamento Grátis",
          points: 80,
          desc: "Resgate imediato no próximo corte.",
        },
        {
          id: "r2",
          title: "Barboterapia na Toalha Quente Grátis",
          points: 150,
          desc: "Sessão completa de barba por nossa conta.",
        },
        {
          id: "r3",
          title: "Corte + Barba 100% Cortesia VIP",
          points: 250,
          desc: "O prêmio clássico do nosso Clube de Fidelidade.",
        },
      ],
    };
  }

  if (
    /est[eé]tica|beleza|sal[aã]o|manicure|pedicure|lash|c[ií]lios|sobrancelha|depila|massagem|spa|bronze|maquiagem/i.test(
      text,
    )
  ) {
    return {
      category: "beauty",
      ctaLabel: "🗓️ Agendar Procedimento",
      isBooking: true,
      services: [
        {
          name: "Limpeza de Pele Profunda",
          price: "R$ 160",
          duration: "60 min",
          desc: "Extração, vapor de ozônio e máscara calmante.",
        },
        {
          name: "Drenagem Linfática Corporal",
          price: "R$ 130",
          duration: "50 min",
          desc: "Redução de medidas e bem-estar.",
        },
        {
          name: "Design de Sobrancelhas & Lash",
          price: "R$ 80",
          duration: "45 min",
          desc: "Mapeamento facial personalizado.",
        },
        {
          name: "Massagem Relaxante com Pedras",
          price: "R$ 150",
          duration: "60 min",
          desc: "Alívio profundo de tensões.",
        },
      ],
      deal: {
        title: "Day Spa: Limpeza de Pele + Hidratação Ouro",
        description:
          "Protocolo iluminador completo com máscara de colágeno por valor promocional relâmpago.",
        originalPrice: "R$ 220,00",
        dealPrice: "R$ 149,00",
        badge: "32% OFF",
        codePrefix: "GLOW32",
        remaining: 7,
      },
      loyaltyRewards: [
        {
          id: "r1",
          title: "Design de Sobrancelhas Cortesia",
          points: 100,
          desc: "Realce seu olhar sem custo adicional.",
        },
        {
          id: "r2",
          title: "Hidratação Facial Profunda Grátis",
          points: 180,
          desc: "Protocolo revitalizante completo.",
        },
        {
          id: "r3",
          title: "Sessão de Massagem Relaxante VIP",
          points: 300,
          desc: "1 hora de autocuidado 100% grátis.",
        },
      ],
    };
  }

  if (
    /restauran|lanche|burger|hamburguer|pizza|pizzaria|a[cç]a[ií]|sorvet|delivery|comida|marmita|padaria|confeitaria|sushi|japon[eê]s|churrasco|espetinho|pastel/i.test(
      text,
    )
  ) {
    return {
      category: "food",
      ctaLabel: "🍕 Ver Cardápio & Pedir",
      isBooking: false,
      services: [
        {
          name: "Especial da Casa (Mais Pedido)",
          price: "R$ 44,90",
          duration: "25-35 min",
          desc: "Preparado na hora com ingredientes selecionados.",
        },
        {
          name: "Combo Casal Completo + Bebidas",
          price: "R$ 84,90",
          duration: "30-40 min",
          desc: "Porção generosa para 2 pessoas com acompanhamento.",
        },
        {
          name: "Sobremesa Artesanal",
          price: "R$ 18,90",
          duration: "Pronta entrega",
          desc: "Receita exclusiva da casa.",
        },
      ],
      deal: {
        title: "Cupom Combo VIP + Entrega Grátis Hoje",
        description:
          "Resgate seu cupom exclusivo para ganhar desconto direto + taxa de entrega grátis no pedido de hoje.",
        originalPrice: "R$ 89,90",
        dealPrice: "R$ 69,90",
        badge: "R$ 20 OFF + FRETE GRÁTIS",
        codePrefix: "FOME20",
        remaining: 9,
      },
      loyaltyRewards: [
        {
          id: "r1",
          title: "Bebida ou Sobremesa Grátis",
          points: 80,
          desc: "Adicione ao seu próximo pedido sem custo.",
        },
        {
          id: "r2",
          title: "Vale R$ 25,00 de Desconto no Cardápio",
          points: 150,
          desc: "Válido para qualquer item do cardápio.",
        },
        {
          id: "r3",
          title: "Prato / Combo Principal 100% Grátis",
          points: 250,
          desc: "Prêmio especial para clientes fiéis da casa!",
        },
      ],
    };
  }

  return {
    category: "service",
    ctaLabel: "🗓️ Agendar Atendimento",
    isBooking: true,
    services: [
      {
        name: "Diagnóstico & Atendimento Inicial",
        price: "Cortesia",
        duration: "40 min",
        desc: "Análise completa da sua necessidade.",
      },
      {
        name: "Atendimento / Serviço Completo",
        price: "R$ 150",
        duration: "60 min",
        desc: "Execução com garantia e equipe especializada.",
      },
      {
        name: "Pacote Premium Prioritário",
        price: "R$ 280",
        duration: "90 min",
        desc: "Atendimento VIP com acompanhamento dedicado.",
      },
    ],
    deal: {
      title: "Condição Especial: 30% OFF no Primeiro Atendimento",
      description:
        "Garanta prioridade na agenda e desconto exclusivo para novos clientes que reservarem pelo site hoje.",
      originalPrice: "R$ 200,00",
      dealPrice: "R$ 139,90",
      badge: "30% OFF HOJE",
      codePrefix: "VIP30",
      remaining: 5,
    },
    loyaltyRewards: [
      {
        id: "r1",
        title: "Bônus de R$ 30 no Próximo Serviço",
        points: 100,
        desc: "Desconto direto acumulativo no caixa.",
      },
      {
        id: "r2",
        title: "Upgrade para Atendimento VIP Prioritário",
        points: 180,
        desc: "Benefício exclusivo para clientes Ouro.",
      },
      {
        id: "r3",
        title: "1 Serviço / Revisão Completa Cortesia",
        points: 300,
        desc: "Recompensa máxima de fidelidade.",
      },
    ],
  };
}

/**
 * Aplica regras CSS de visibilidade para ligar/desligar recursos instantaneamente no HTML.
 */
export function applyFeaturesToHtml(sourceHtml: string, featureFlags: EiaLinkFeatureFlags): string {
  if (!sourceHtml) return sourceHtml;

  let styleRules = "";
  if (featureFlags.agenda_enabled === false) {
    styleRules += `[data-feature="agenda"], [data-action="agendar"], a[href*="/agendar"], .feature-agenda { display: none !important; } `;
  }
  if (featureFlags.ai_concierge_enabled === false) {
    styleRules += `[data-feature="concierge"], [data-feature="ai-chat"], #eialink-concierge-trigger, #eialink-concierge-modal, .feature-concierge { display: none !important; } `;
  }
  if (featureFlags.deals_enabled === false) {
    styleRules += `[data-feature="deals"], #eialink-deals-trigger, #eialink-deals-modal, .feature-deals { display: none !important; } `;
  }
  if (featureFlags.loyalty_enabled === false) {
    styleRules += `[data-feature="loyalty"], #eialink-loyalty-trigger, #eialink-loyalty-modal, .feature-loyalty { display: none !important; } `;
  }
  if (featureFlags.gps_enabled === false) {
    styleRules += `[data-feature="gps"], [data-feature="map"], iframe[src*="maps"], a[href*="maps.google"], a[href*="waze.com"], .feature-gps { display: none !important; } `;
  }
  if (featureFlags.whatsapp_enabled === false) {
    styleRules += `[data-feature="whatsapp"], a[href*="wa.me"], a[href*="whatsapp.com"], .feature-whatsapp { display: none !important; } `;
  }

  const attrs = [
    `data-agenda="${featureFlags.agenda_enabled !== false ? "on" : "off"}"`,
    `data-concierge="${featureFlags.ai_concierge_enabled !== false ? "on" : "off"}"`,
    `data-deals="${featureFlags.deals_enabled !== false ? "on" : "off"}"`,
    `data-loyalty="${featureFlags.loyalty_enabled !== false ? "on" : "off"}"`,
    `data-gps="${featureFlags.gps_enabled !== false ? "on" : "off"}"`,
    `data-whatsapp="${featureFlags.whatsapp_enabled !== false ? "on" : "off"}"`,
  ].join(" ");

  const styleTag = `<style id="eialink-feature-overrides" ${attrs}>${styleRules}</style>`;

  if (sourceHtml.includes('id="eialink-feature-overrides"')) {
    return sourceHtml.replace(
      /<style id="eialink-feature-overrides"[^>]*>[\s\S]*?<\/style>/i,
      styleTag,
    );
  }

  if (sourceHtml.includes("</head>")) {
    return sourceHtml.replace("</head>", `${styleTag}</head>`);
  }
  return `${styleTag}${sourceHtml}`;
}

/**
 * Injeta o orquestrador nativo do EiaLink no HTML gerado pela IA.
 * Garante que Agenda, Atendente Virtual, Mural de Ofertas, Fidelidade, GPS e WhatsApp
 * funcionem de verdade com dados de exemplo do nicho e possam ser ligados/desligados.
 */
export function injectEiaLinkFeatureRuntime(html: string, ctx: FeatureRuntimeContext): string {
  if (!html || html.length < 30) return html;

  const rawPhone = ctx.whatsapp || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const normalizedPhone =
    cleanPhone.length === 10 || cleanPhone.length === 11 ? "55" + cleanPhone : cleanPhone;

  let prepared = html.replace(/<script id="eialink-runtime">[\s\S]*?<\/script>/gi, "");

  if (ctx.features) {
    prepared = applyFeaturesToHtml(prepared, ctx.features);
  }

  if (normalizedPhone) {
    prepared = prepared
      .replace(/\{NUMERO_WHATSAPP\}/g, normalizedPhone)
      .replace(/wa\.me\/5555\d+/g, `wa.me/${normalizedPhone}`)
      .replace(/wa\.me\/0000\d+/g, `wa.me/${normalizedPhone}`);
  }
  if (ctx.address) {
    const encoded = encodeURIComponent(ctx.address);
    prepared = prepared
      .replace(/\{ENDERECO_OU_NOME_EMPRESA\}/g, encoded)
      .replace(/\{ENDERECO_URL_ENCODED\}/g, encoded);
  }
  if (ctx.slug) {
    prepared = prepared
      .replace(/\{slug\}/g, ctx.slug)
      .replace(
        /href=["']#(?:agendar|agenda|booking|agendamento)["']/gi,
        `href="/agendar/${ctx.slug}" data-action="agendar"`,
      );
  }

  const pack = getRuntimeNichePack(ctx.niche, ctx.businessName);

  const script = `
<script id="eialink-runtime">
(function() {
  const businessSlug = ${JSON.stringify(ctx.slug || "")};
  const businessName = ${JSON.stringify(ctx.businessName || "Nossa Empresa")};
  const cleanPhone = ${JSON.stringify(normalizedPhone)};
  const address = ${JSON.stringify(ctx.address || "Atendimento local e agendado")};
  const nichePack = ${JSON.stringify(pack)};

  function resolveBookingSlug(href) {
    if (businessSlug) return businessSlug;
    if (href && href.includes("/agendar/")) {
      const m = href.match(/\\/agendar\\/([^/?#"']+)/i);
      if (m && m[1] && m[1] !== "{slug}") return decodeURIComponent(m[1]);
    }
    const existingLink = document.querySelector('a[href*="/agendar/"]');
    if (existingLink) {
      const linkHref = existingLink.getAttribute("href") || "";
      const m = linkHref.match(/\\/agendar\\/([^/?#"']+)/i);
      if (m && m[1] && m[1] !== "{slug}") return decodeURIComponent(m[1]);
    }
    try {
      const topPath = window.top.location.pathname || "";
      const pMatch = topPath.match(/\\/p\\/([^/?#]+)/i);
      if (pMatch && pMatch[1]) return decodeURIComponent(pMatch[1]);
    } catch (err) {}
    return "";
  }

  function openBookingUrl(customHref) {
    const resolvedSlug = resolveBookingSlug(customHref || "");
    if (resolvedSlug) {
      const targetUrl = "/agendar/" + encodeURIComponent(resolvedSlug);
      try {
        const isEditor = window.top.location.pathname.includes("/studio-pro");
        if (isEditor) {
          const win = window.open(targetUrl, "_blank");
          if (!win) window.top.location.href = targetUrl;
        } else {
          window.top.location.href = targetUrl;
        }
      } catch (navErr) {
        window.location.href = targetUrl;
      }
    } else if (cleanPhone) {
      const msg = encodeURIComponent(
        "Olá! Gostaria de agendar um horário com " + businessName + ". Quais são os horários disponíveis?"
      );
      window.open("https://wa.me/" + cleanPhone + "?text=" + msg, "_blank");
    }
  }

  function openWhatsAppMsg(textMsg) {
    const phone = cleanPhone || "5511999999999";
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(textMsg), "_blank");
  }

  function syncBookingLinks() {
    const slug = resolveBookingSlug("");
    if (!slug) return;
    const nodes = document.querySelectorAll("a, button");
    nodes.forEach(function(el) {
      if (el.closest("#eialink-widgets-root")) return;
      const text = (el.textContent || "").toLowerCase().trim();
      const href = (el.getAttribute("href") || "").trim();
      const action = (el.getAttribute("data-action") || "").toLowerCase().trim();
      const matchesBooking =
        action === "agendar" ||
        action === "agenda" ||
        action === "booking" ||
        href.includes("/agendar") ||
        href === "#agendar" ||
        href === "#agenda" ||
        text.includes("agendar") ||
        text.includes("agendamento") ||
        text.includes("marcar consulta") ||
        text.includes("marcar horário") ||
        text.includes("marcar horario") ||
        text.includes("reservar horário") ||
        text.includes("reservar horario") ||
        text.includes("escolha seu horário") ||
        text.includes("ver horários") ||
        text.includes("agenda online");
      if (matchesBooking) {
        el.setAttribute("data-action", "agendar");
        if (el.tagName.toLowerCase() === "a") {
          el.setAttribute("href", "/agendar/" + encodeURIComponent(slug));
        }
      }
    });
  }

  function mountInteractiveWidgets() {
    // Preserva intacto o layout de cardápio-pro que já possui barra própria de carrinho e fidelidade
    if (
      document.getElementById("cart-modal") ||
      document.getElementById("product-modal") ||
      typeof window.openProductModal === "function"
    ) {
      return;
    }

    const existingRoot = document.getElementById("eialink-widgets-root");
    if (existingRoot) existingRoot.remove();

    const root = document.createElement("div");
    root.id = "eialink-widgets-root";
    root.innerHTML = \`
      <style>
        #eialink-widgets-root {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #f4f4f5;
          line-height: 1.4;
        }
        #eialink-widgets-dock {
          position: fixed;
          left: 16px;
          bottom: 18px;
          z-index: 9995;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          pointer-events: none;
        }
        .eia-pill-btn {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          background: rgba(15, 15, 20, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .eia-pill-btn:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .eia-pill-deals {
          border-color: rgba(245, 158, 11, 0.55);
          background: linear-gradient(135deg, rgba(24, 20, 12, 0.95), rgba(45, 28, 8, 0.92));
        }
        .eia-pill-loyalty {
          border-color: rgba(168, 85, 247, 0.55);
          background: linear-gradient(135deg, rgba(20, 14, 28, 0.95), rgba(40, 18, 60, 0.92));
        }
        .eia-pill-concierge {
          border-color: rgba(16, 185, 129, 0.55);
          background: linear-gradient(135deg, rgba(12, 24, 20, 0.95), rgba(10, 42, 32, 0.92));
        }
        .eia-badge-tag {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .eia-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(6px);
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .eia-modal-backdrop.is-open {
          display: flex;
        }
        .eia-modal-card {
          width: 100%;
          max-width: 410px;
          background: #111116;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }
        .eia-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }
        .eia-close-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
        }
        .eia-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: #18181f;
          color: #ffffff;
          font-size: 13px;
          outline: none;
          margin-top: 6px;
        }
        .eia-input:focus {
          border-color: #10b981;
        }
        .eia-btn-primary {
          width: 100%;
          padding: 11px 16px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .eia-btn-primary:hover {
          opacity: 0.92;
        }
        /* Chat Window */
        #eialink-concierge-modal {
          position: fixed;
          left: 16px;
          bottom: 18px;
          width: calc(100vw - 32px);
          max-width: 380px;
          height: 540px;
          max-height: calc(100vh - 80px);
          z-index: 9999;
          background: #111116;
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        #eialink-concierge-modal.is-open {
          display: flex;
        }
        .eia-chat-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.32);
          color: #34d399;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          margin: 3px 4px 3px 0;
          transition: background 0.15s;
        }
        .eia-chat-chip:hover {
          background: rgba(16, 185, 129, 0.24);
          color: #ffffff;
        }
      </style>

      <!-- Floating Triggers Dock -->
      <div id="eialink-widgets-dock">
        <button type="button" id="eialink-deals-trigger" data-feature="deals" class="eia-pill-btn eia-pill-deals">
          <span>🔥</span>
          <span>Mural de Ofertas</span>
          <span class="eia-badge-tag" style="background:#f59e0b;color:#000;">\${nichePack.deal.badge}</span>
        </button>

        <button type="button" id="eialink-loyalty-trigger" data-feature="loyalty" class="eia-pill-btn eia-pill-loyalty">
          <span>👑</span>
          <span>Clube Fidelidade VIP</span>
          <span class="eia-badge-tag" style="background:#a855f7;color:#fff;">Pontos</span>
        </button>

        <button type="button" id="eialink-concierge-trigger" data-feature="concierge" class="eia-pill-btn eia-pill-concierge">
          <span style="width:8px;height:8px;border-radius:999px;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span>
          <span>💬 Atendente Online</span>
        </button>
      </div>

      <!-- 1. MODAL MURAL DE OFERTAS -->
      <div id="eialink-deals-modal" data-feature="deals" class="eia-modal-backdrop">
        <div class="eia-modal-card">
          <button type="button" class="eia-close-btn" data-close-modal="eialink-deals-modal">✕</button>
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);color:#fbbf24;font-size:11px;font-weight:700;margin-bottom:10px;">
            ⚡ OFERTA RELÂMPAGO • \${nichePack.deal.badge}
          </div>
          <h3 style="margin:0 0 6px;font-size:17px;font-weight:800;color:#fff;">\${nichePack.deal.title}</h3>
          <p style="margin:0 0 14px;font-size:12.5px;color:#a1a1aa;">\${nichePack.deal.description}</p>

          <div style="display:flex;align-items:baseline;justify-content:space-between;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);margin-bottom:14px;">
            <div>
              <div style="font-size:11px;color:#71717a;text-decoration:line-through;">De \${nichePack.deal.originalPrice}</div>
              <div style="font-size:20px;font-weight:800;color:#fbbf24;">Por \${nichePack.deal.dealPrice}</div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11px;color:#34d399;font-weight:700;">🔥 Restam \${nichePack.deal.remaining} cupons hoje</span>
            </div>
          </div>

          <div id="eia-deal-form-step">
            <label style="font-size:11.5px;color:#d4d4d8;font-weight:600;display:block;">Seu Nome</label>
            <input id="eia-deal-name" class="eia-input" placeholder="Digite seu nome..." />
            <label style="font-size:11.5px;color:#d4d4d8;font-weight:600;display:block;margin-top:10px;">Seu WhatsApp (com DDD)</label>
            <input id="eia-deal-phone" class="eia-input" placeholder="(00) 90000-0000" />
            <button type="button" id="eia-deal-claim-btn" class="eia-btn-primary" style="margin-top:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;">
              🎟️ Resgatar Cupom de Desconto Agora
            </button>
          </div>

          <div id="eia-deal-success-step" style="display:none;text-align:center;padding-top:6px;">
            <div style="padding:12px;border-radius:14px;background:rgba(16,185,129,0.12);border:1px dashed #10b981;margin-bottom:12px;">
              <div style="font-size:11px;color:#34d399;font-weight:700;">SEU CUPOM EXCLUSIVO FOI LIBERADO:</div>
              <div id="eia-deal-code-val" style="font-size:19px;font-weight:900;color:#fff;letter-spacing:1px;margin-top:4px;"></div>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" id="eia-deal-use-btn" class="eia-btn-primary" style="background:#10b981;color:#000;">
                \${nichePack.isBooking ? "🗓️ Agendar com Desconto" : "💬 Validar no WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. MODAL CLUBE DE FIDELIDADE VIP -->
      <div id="eialink-loyalty-modal" data-feature="loyalty" class="eia-modal-backdrop">
        <div class="eia-modal-card">
          <button type="button" class="eia-close-btn" data-close-modal="eialink-loyalty-modal">✕</button>
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.35);color:#c084fc;font-size:11px;font-weight:700;margin-bottom:8px;">
            👑 CLUBE DE FIDELIDADE VIP
          </div>
          <h3 style="margin:0 0 4px;font-size:17px;font-weight:800;color:#fff;">\${businessName}</h3>
          <p style="margin:0 0 12px;font-size:12px;color:#a1a1aa;">Acumule pontos a cada atendimento ou compra e troque por recompensas exclusivas!</p>

          <!-- Saldo Demonstrativo / Consulta -->
          <div style="padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(59,130,246,0.12));border:1px solid rgba(168,85,247,0.35);margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:11px;color:#d8b4fe;font-weight:600;">SEU SALDO DISPONÍVEL</div>
                <div style="font-size:22px;font-weight:900;color:#fff;"><span id="eia-loyalty-pts">120</span> <span style="font-size:12px;color:#c084fc;">pontos</span></div>
              </div>
              <span style="padding:4px 10px;border-radius:999px;background:rgba(250,204,21,0.18);border:1px solid rgba(250,204,21,0.4);color:#fde047;font-size:11px;font-weight:800;">⭐ Nível Ouro</span>
            </div>
            <div style="margin-top:10px;display:flex;gap:6px;">
              <input id="eia-loyalty-code-input" class="eia-input" style="margin-top:0;padding:7px 10px;font-size:12px;" placeholder="Código de pontos do balcão (ex: VIP50)" />
              <button type="button" id="eia-loyalty-add-pts-btn" style="padding:7px 12px;border-radius:10px;border:none;background:#a855f7;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;">+ Creditar</button>
            </div>
          </div>

          <div style="font-size:12px;font-weight:700;color:#e4e4e7;margin-bottom:8px;">🎁 Recompensas Disponíveis:</div>
          <div id="eia-loyalty-rewards-list" style="display:flex;flex-direction:column;gap:8px;">
            \${nichePack.loyaltyRewards.map(function(r) {
              return \`
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                  <div>
                    <div style="font-size:12.5px;font-weight:700;color:#fff;">\${r.title}</div>
                    <div style="font-size:11px;color:#a1a1aa;">\${r.desc}</div>
                    <div style="font-size:11px;font-weight:800;color:#c084fc;margin-top:2px;">🪙 \${r.points} pontos</div>
                  </div>
                  <button type="button" class="eia-redeem-reward-btn" data-reward-title="\${r.title}" data-reward-pts="\${r.points}" style="padding:7px 11px;border-radius:10px;border:1px solid rgba(168,85,247,0.45);background:rgba(168,85,247,0.18);color:#e9d5ff;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">
                    Resgatar
                  </button>
                </div>
              \`;
            }).join("")}
          </div>

          <div id="eia-loyalty-voucher-box" style="display:none;margin-top:12px;padding:11px;border-radius:12px;background:rgba(16,185,129,0.14);border:1px dashed #10b981;text-align:center;">
            <div style="font-size:11px;color:#34d399;font-weight:700;">🎉 VOUCHER GERADO COM SUCESSO!</div>
            <div id="eia-loyalty-voucher-code" style="font-size:16px;font-weight:900;color:#fff;margin:3px 0;"></div>
            <div style="font-size:11px;color:#d4d4d8;">Apresente na recepção ou envie pelo WhatsApp.</div>
          </div>
        </div>
      </div>

      <!-- 3. JANELA DO ATENDENTE VIRTUAL INTELIGENTE -->
      <div id="eialink-concierge-modal" data-feature="concierge">
        <div style="padding:13px 16px;background:#181820;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:999px;background:linear-gradient(135deg,#10b981,#059669);color:#000;font-weight:900;font-size:15px;display:flex;align-items:center;justify-content:center;">
              \${businessName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-size:13px;font-weight:800;color:#fff;">\${businessName}</div>
              <div style="font-size:11px;color:#34d399;display:flex;align-items:center;gap:5px;">
                <span style="width:6px;height:6px;border-radius:999px;background:#10b981;display:inline-block;"></span>
                <span id="eia-chat-status">Atendente Virtual Online</span>
              </div>
            </div>
          </div>
          <button type="button" class="eia-close-btn" style="position:static;" data-close-modal="eialink-concierge-modal">✕</button>
        </div>

        <div id="eia-chat-messages" style="flex:1;padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#0d0d12;">
        </div>

        <form id="eia-chat-form" style="padding:10px 12px;background:#181820;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:8px;">
          <input id="eia-chat-input" class="eia-input" style="margin-top:0;flex:1;" placeholder="Digite sua dúvida ou pedido..." autocomplete="off" />
          <button type="submit" style="padding:0 14px;border-radius:12px;border:none;background:#10b981;color:#000;font-weight:800;font-size:12.5px;cursor:pointer;">
            Enviar
          </button>
        </form>
      </div>
    \`;

    document.body.appendChild(root);

    // Eventos de abrir/fechar modais
    const dealsTrigger = document.getElementById("eialink-deals-trigger");
    const dealsModal = document.getElementById("eialink-deals-modal");
    const loyaltyTrigger = document.getElementById("eialink-loyalty-trigger");
    const loyaltyModal = document.getElementById("eialink-loyalty-modal");
    const conciergeTrigger = document.getElementById("eialink-concierge-trigger");
    const conciergeModal = document.getElementById("eialink-concierge-modal");

    if (dealsTrigger && dealsModal) {
      dealsTrigger.addEventListener("click", function() {
        dealsModal.classList.add("is-open");
      });
    }
    if (loyaltyTrigger && loyaltyModal) {
      loyaltyTrigger.addEventListener("click", function() {
        loyaltyModal.classList.add("is-open");
      });
    }
    if (conciergeTrigger && conciergeModal) {
      conciergeTrigger.addEventListener("click", function() {
        conciergeModal.classList.add("is-open");
        if (!conciergeModal.dataset.initialized) {
          conciergeModal.dataset.initialized = "1";
          initConciergeConversation();
        }
      });
    }

    root.querySelectorAll("[data-close-modal]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const targetId = btn.getAttribute("data-close-modal");
        const modal = targetId ? document.getElementById(targetId) : null;
        if (modal) modal.classList.remove("is-open");
      });
    });

    // Lógica de Resgate no Mural de Ofertas
    const claimBtn = document.getElementById("eia-deal-claim-btn");
    if (claimBtn) {
      claimBtn.addEventListener("click", function() {
        const nameVal = (document.getElementById("eia-deal-name")?.value || "").trim() || "Cliente VIP";
        const code = nichePack.deal.codePrefix + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
        const codeEl = document.getElementById("eia-deal-code-val");
        if (codeEl) codeEl.textContent = code;
        const formStep = document.getElementById("eia-deal-form-step");
        const successStep = document.getElementById("eia-deal-success-step");
        if (formStep) formStep.style.display = "none";
        if (successStep) successStep.style.display = "block";

        const useBtn = document.getElementById("eia-deal-use-btn");
        if (useBtn) {
          useBtn.onclick = function() {
            if (nichePack.isBooking && resolveBookingSlug("")) {
              openBookingUrl("");
            } else {
              openWhatsAppMsg("Olá! Sou " + nameVal + " e resgatei o cupom " + code + " (" + nichePack.deal.title + " por " + nichePack.deal.dealPrice + ") no site!");
            }
          };
        }
      });
    }

    // Lógica do Clube de Fidelidade VIP
    let currentPts = 120;
    const ptsEl = document.getElementById("eia-loyalty-pts");
    const addPtsBtn = document.getElementById("eia-loyalty-add-pts-btn");
    if (addPtsBtn) {
      addPtsBtn.addEventListener("click", function() {
        const codeInput = document.getElementById("eia-loyalty-code-input");
        const val = (codeInput?.value || "").trim();
        if (!val) return;
        currentPts += 50;
        if (ptsEl) ptsEl.textContent = String(currentPts);
        if (codeInput) codeInput.value = "";
        const vBox = document.getElementById("eia-loyalty-voucher-box");
        const vCode = document.getElementById("eia-loyalty-voucher-code");
        if (vBox && vCode) {
          vBox.style.display = "block";
          vCode.textContent = "+50 PONTOS CREDITADOS (" + val.toUpperCase() + ")";
        }
      });
    }

    root.querySelectorAll(".eia-redeem-reward-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const title = btn.getAttribute("data-reward-title") || "Prêmio VIP";
        const cost = Number(btn.getAttribute("data-reward-pts") || "80");
        const voucher = "FID-" + Math.random().toString(36).substring(2, 7).toUpperCase();
        if (currentPts >= cost) {
          currentPts -= cost;
          if (ptsEl) ptsEl.textContent = String(currentPts);
        }
        const vBox = document.getElementById("eia-loyalty-voucher-box");
        const vCode = document.getElementById("eia-loyalty-voucher-code");
        if (vBox && vCode) {
          vBox.style.display = "block";
          vCode.textContent = voucher + " • " + title;
        }
      });
    });

    // Lógica do Atendente Virtual Funcional
    const chatMessages = document.getElementById("eia-chat-messages");
    const chatForm = document.getElementById("eia-chat-form");
    const chatInput = document.getElementById("eia-chat-input");
    const chatStatus = document.getElementById("eia-chat-status");

    function appendBotMessage(htmlText, chips) {
      if (!chatMessages) return;
      if (chatStatus) chatStatus.textContent = "digitando...";
      setTimeout(function() {
        if (chatStatus) chatStatus.textContent = "Atendente Virtual Online";
        const bubble = document.createElement("div");
        bubble.style.cssText = "align-self:flex-start;max-width:88%;padding:11px 13px;border-radius:16px 16px 16px 4px;background:#1c1c26;border:1px solid rgba(255,255,255,0.08);font-size:12.5px;color:#f4f4f5;";
        bubble.innerHTML = htmlText;

        if (chips && chips.length > 0) {
          const chipsWrap = document.createElement("div");
          chipsWrap.style.marginTop = "8px";
          chips.forEach(function(chip) {
            const cBtn = document.createElement("button");
            cBtn.type = "button";
            cBtn.className = "eia-chat-chip";
            cBtn.textContent = chip.label;
            cBtn.addEventListener("click", function() {
              handleChatAction(chip.action, chip.label);
            });
            chipsWrap.appendChild(cBtn);
          });
          bubble.appendChild(chipsWrap);
        }

        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 320);
    }

    function appendUserMessage(text) {
      if (!chatMessages) return;
      const bubble = document.createElement("div");
      bubble.style.cssText = "align-self:flex-end;max-width:82%;padding:9px 13px;border-radius:16px 16px 4px 16px;background:#10b981;color:#000;font-weight:700;font-size:12.5px;";
      bubble.textContent = text;
      chatMessages.appendChild(bubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const defaultChips = [
      nichePack.isBooking
        ? { label: "🗓️ Agendar Horário Online", action: "booking" }
        : { label: "🍕 Ver Opções & Pedir", action: "services" },
      { label: "🛠️ Serviços & Preços", action: "services" },
      { label: "🔥 Cupom / Oferta do Dia", action: "deals" },
      { label: "👑 Pontos de Fidelidade", action: "loyalty" },
      { label: "📍 Localização & Horários", action: "location" },
      { label: "💬 Falar no WhatsApp", action: "whatsapp" },
    ];

    function initConciergeConversation() {
      appendBotMessage(
        "Olá! Seja muito bem-vindo(a) à <b>" + businessName + "</b>! 👋✨<br><br>Sou o assistente virtual inteligente da empresa. Como posso ajudar você hoje?",
        defaultChips
      );
    }

    function handleChatAction(action, userLabel) {
      if (userLabel) appendUserMessage(userLabel);

      if (action === "booking") {
        appendBotMessage(
          "Excelente! Nossa agenda online está disponível com confirmação imediata. Escolha o serviço, o dia e o horário de sua preferência clicando abaixo:",
          [
            { label: "🗓️ Abrir Agenda Online Agora", action: "open_booking_now" },
            { label: "🛠️ Ver Serviços e Preços Antes", action: "services" },
          ]
        );
        return;
      }

      if (action === "open_booking_now") {
        openBookingUrl("");
        return;
      }

      if (action === "services") {
        const listHtml = nichePack.services
          .map(function(s) {
            return "<div style='margin:6px 0;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);'><b>" + s.name + "</b> • <span style='color:#34d399;font-weight:700;'>" + s.price + "</span> <small style='color:#a1a1aa;'>(" + s.duration + ")</small><br><span style='font-size:11px;color:#a1a1aa;'>" + s.desc + "</span></div>";
          })
          .join("");
        appendBotMessage(
          "Confira nossos principais serviços e valores atualizados:<br>" + listHtml,
          [
            nichePack.isBooking
              ? { label: "🗓️ Agendar um Serviço", action: "open_booking_now" }
              : { label: "💬 Fazer Pedido no WhatsApp", action: "open_wa_now" },
            { label: "🔥 Ver Cupom de Desconto", action: "deals" },
          ]
        );
        return;
      }

      if (action === "deals") {
        appendBotMessage(
          "🔥 Temos uma oferta relâmpago ativa hoje:<br><br><b>" + nichePack.deal.title + "</b><br>De <s>" + nichePack.deal.originalPrice + "</s> por <b style='color:#fbbf24;'>" + nichePack.deal.dealPrice + "</b> (" + nichePack.deal.badge + ")!",
          [
            { label: "🎟️ Abrir e Resgatar Meu Cupom", action: "open_deals_modal" },
            { label: "🗓️ Agendar Horário", action: "open_booking_now" },
          ]
        );
        return;
      }

      if (action === "open_deals_modal") {
        if (dealsModal) dealsModal.classList.add("is-open");
        return;
      }

      if (action === "loyalty") {
        appendBotMessage(
          "👑 No <b>Clube de Fidelidade VIP</b> da " + businessName + ", cada atendimento ou compra vale pontos que você troca por prêmios como <b>" + nichePack.loyaltyRewards[0].title + "</b>!",
          [
            { label: "👑 Abrir Minha Carteira de Pontos", action: "open_loyalty_modal" },
            { label: "🛠️ Ver Serviços", action: "services" },
          ]
        );
        return;
      }

      if (action === "open_loyalty_modal") {
        if (loyaltyModal) loyaltyModal.classList.add("is-open");
        return;
      }

      if (action === "location") {
        appendBotMessage(
          "📍 <b>Endereço & Horário de Atendimento:</b><br><br>🏠 <b>Local:</b> " + address + "<br>⏰ <b>Horário:</b> Segunda a Sábado, das 09h às 19h.",
          [
            { label: "🗺️ Abrir Rota no Google Maps", action: "open_maps" },
            { label: "🚗 Abrir no Waze", action: "open_waze" },
            { label: "🗓️ Agendar Horário", action: "open_booking_now" },
          ]
        );
        return;
      }

      if (action === "open_maps") {
        window.open("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(address), "_blank");
        return;
      }

      if (action === "open_waze") {
        window.open("https://waze.com/ul?q=" + encodeURIComponent(address), "_blank");
        return;
      }

      if (action === "whatsapp" || action === "open_wa_now") {
        openWhatsAppMsg("Olá! Estava conversando com o Atendente Virtual no site da " + businessName + " e gostaria de atendimento.");
        return;
      }
    }

    if (chatForm && chatInput) {
      chatForm.addEventListener("submit", function(ev) {
        ev.preventDefault();
        const text = (chatInput.value || "").trim();
        if (!text) return;
        chatInput.value = "";
        appendUserMessage(text);

        const lower = text.toLowerCase();
        if (/agendar|agenda|marcar|consulta|hor[aá]rio|vaga|dispon[ií]vel/i.test(lower)) {
          handleChatAction("booking", "");
        } else if (/pre[cç]o|valor|quanto|custa|tabela|servi[cç]o|tratamento|corte|card[aá]pio/i.test(lower)) {
          handleChatAction("services", "");
        } else if (/oferta|promo[cç][aã]o|desconto|cupom|mural|barato/i.test(lower)) {
          handleChatAction("deals", "");
        } else if (/fidelidade|ponto|pr[eê]mio|clube|vip|voucher|recompensa/i.test(lower)) {
          handleChatAction("loyalty", "");
        } else if (/onde|endere[cç]o|local|rua|bairro|chegar|mapa|waze|funciona|abre|fecha/i.test(lower)) {
          handleChatAction("location", "");
        } else if (/whatsapp|humano|atendente|falar|telefone|contato/i.test(lower)) {
          appendBotMessage(
            "Claro! Você pode falar diretamente com nossa equipe no WhatsApp clicando abaixo ou agendar seu horário online:",
            [
              { label: "💬 Abrir WhatsApp Agora", action: "open_wa_now" },
              { label: "🗓️ Agendar Horário Online", action: "open_booking_now" },
            ]
          );
        } else {
          appendBotMessage(
            "Perfeito! Aqui na <b>" + businessName + "</b> temos agendamento online rápido, tabela de serviços, cupom do dia e clube de pontos. Como prefere prosseguir?",
            defaultChips
          );
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      syncBookingLinks();
      mountInteractiveWidgets();
    });
  } else {
    syncBookingLinks();
    mountInteractiveWidgets();
  }

  function handleActionClick(e) {
    const target = e.target.closest("a, button");
    if (!target) return;
    if (target.closest("#eialink-widgets-root")) return;

    const href = (target.getAttribute("href") || "").trim();
    const text = (target.textContent || "").toLowerCase().trim();
    const action = (target.getAttribute("data-action") || "").toLowerCase().trim();

    // 1. AÇÃO DE MURAL DE OFERTAS / CUPOM
    if (
      action === "ofertas" ||
      action === "deals" ||
      href === "#ofertas" ||
      href === "#cupom" ||
      text.includes("mural de ofertas") ||
      text.includes("resgatar cupom") ||
      text.includes("oferta do dia")
    ) {
      e.preventDefault();
      e.stopPropagation();
      const modal = document.getElementById("eialink-deals-modal");
      if (modal) modal.classList.add("is-open");
      return;
    }

    // 2. AÇÃO DE FIDELIDADE / CLUBE VIP
    if (
      action === "fidelidade" ||
      action === "loyalty" ||
      href === "#fidelidade" ||
      href === "#pontos" ||
      text.includes("clube de fidelidade") ||
      text.includes("clube fidelidade") ||
      text.includes("meus pontos") ||
      text.includes("programa de fidelidade")
    ) {
      e.preventDefault();
      e.stopPropagation();
      const modal = document.getElementById("eialink-loyalty-modal");
      if (modal) modal.classList.add("is-open");
      return;
    }

    // 3. AÇÃO DE ATENDENTE VIRTUAL / CHAT
    if (
      action === "atendente" ||
      action === "concierge" ||
      action === "chat" ||
      href === "#chat" ||
      href === "#atendente" ||
      text.includes("atendente virtual") ||
      text.includes("chat online")
    ) {
      e.preventDefault();
      e.stopPropagation();
      const trigger = document.getElementById("eialink-concierge-trigger");
      if (trigger) trigger.click();
      return;
    }

    // 4. AÇÃO DE AGENDAMENTO
    const isBooking =
      action === "agendar" ||
      action === "agenda" ||
      action === "booking" ||
      href.includes("/agendar") ||
      href === "#agendar" ||
      href === "#agenda" ||
      text.includes("agendar") ||
      text.includes("agendamento") ||
      text.includes("marcar consulta") ||
      text.includes("marcar horário") ||
      text.includes("marcar horario") ||
      text.includes("reservar horário") ||
      text.includes("reservar horario") ||
      text.includes("escolha seu horário") ||
      text.includes("ver horários") ||
      text.includes("agenda online");

    if (isBooking) {
      e.preventDefault();
      e.stopPropagation();
      openBookingUrl(href);
      return;
    }

    // 5. AÇÃO DE GPS / GOOGLE MAPS / WAZE
    const isMaps =
      action === "maps" ||
      action === "gps" ||
      href.includes("maps.google") ||
      href.includes("google.com/maps") ||
      text.includes("google maps") ||
      text.includes("traçar rota");

    if (isMaps && address) {
      e.preventDefault();
      e.stopPropagation();
      window.open("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(address), "_blank");
      return;
    }

    const isWaze =
      action === "waze" ||
      href.includes("waze.com") ||
      text.includes("waze") ||
      text.includes("abrir no waze");

    if (isWaze && address) {
      e.preventDefault();
      e.stopPropagation();
      window.open("https://waze.com/ul?q=" + encodeURIComponent(address), "_blank");
      return;
    }

    // 6. AÇÃO DE WHATSAPP / CONTATO
    const isWa =
      action === "whatsapp" ||
      action === "contato" ||
      href.includes("wa.me") ||
      href.includes("whatsapp.com") ||
      text.includes("whatsapp") ||
      text.includes("falar no whatsapp") ||
      text.includes("tirar dúvidas");

    if (isWa && cleanPhone) {
      if (!href || href === "#" || href.includes("{NUMERO_WHATSAPP}") || href.includes("5555") || href.includes("000000000")) {
        e.preventDefault();
        e.stopPropagation();
        const msg = encodeURIComponent("Olá! Vim através do site e gostaria de mais informações.");
        window.open("https://wa.me/" + cleanPhone + "?text=" + msg, "_blank");
        return;
      }
    }
  }

  document.addEventListener("click", handleActionClick, true);
})();
</script>
`;

  if (prepared.includes("</head>")) {
    return prepared.replace("</head>", `${script}</head>`);
  }
  return `${prepared}${script}`;
}
