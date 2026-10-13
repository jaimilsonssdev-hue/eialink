export interface FeatureRuntimeContext {
  slug?: string;
  businessName?: string;
  whatsapp?: string;
  address?: string;
}

/**
 * Injeta o orquestrador nativo do EiaLink no HTML gerado pela IA.
 * Garante que qualquer botão de Agendamento, GPS (Maps/Waze) ou WhatsApp
 * acione a ferramenta real correspondente, sem links mortos ou fictícios.
 */
export function injectEiaLinkFeatureRuntime(
  html: string,
  ctx: FeatureRuntimeContext,
): string {
  if (!html || html.length < 30) return html;

  const rawPhone = ctx.whatsapp || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const normalizedPhone =
    cleanPhone.length === 10 || cleanPhone.length === 11
      ? "55" + cleanPhone
      : cleanPhone;

  // Substitui placeholders fictícios caso a IA os tenha gerado
  let prepared = html;
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
    prepared = prepared.replace(/\{slug\}/g, ctx.slug);
  }

  const script = `
<script id="eialink-runtime">
(function() {
  const businessSlug = ${JSON.stringify(ctx.slug || "")};
  const businessName = ${JSON.stringify(ctx.businessName || "")};
  const cleanPhone = ${JSON.stringify(normalizedPhone)};
  const address = ${JSON.stringify(ctx.address || "")};

  function handleActionClick(e) {
    const target = e.target.closest("a, button");
    if (!target) return;

    const href = (target.getAttribute("href") || "").trim();
    const text = (target.textContent || "").toLowerCase().trim();
    const action = (target.getAttribute("data-action") || "").toLowerCase().trim();

    // 1. AÇÃO DE AGENDAMENTO
    const isBooking =
      action === "agendar" ||
      action === "agenda" ||
      action === "booking" ||
      href.includes("/agendar") ||
      href === "#agendar" ||
      href === "#agenda" ||
      text.includes("agendar") ||
      text.includes("agendamento") ||
      text.includes("reservar horário") ||
      text.includes("marcar horário") ||
      text.includes("escolha seu horário");

    if (isBooking) {
      e.preventDefault();
      e.stopPropagation();
      if (businessSlug) {
        window.top.location.href = "/agendar/" + encodeURIComponent(businessSlug);
      } else if (cleanPhone) {
        const msg = encodeURIComponent(
          "Olá! Gostaria de agendar um horário com " + (businessName || "a empresa") + ". Quais são os horários disponíveis?"
        );
        window.open("https://wa.me/" + cleanPhone + "?text=" + msg, "_blank");
      }
      return;
    }

    // 2. AÇÃO DE GPS / GOOGLE MAPS / WAZE
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

    // 3. AÇÃO DE WHATSAPP / CONTATO
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

