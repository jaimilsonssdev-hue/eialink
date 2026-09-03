import { useState } from "react";
import { ArrowUpRight, ExternalLink, MessageCircle } from "lucide-react";
import type { PublicBio, PublicLink, TrackEvent } from "./types";
import { safeExternalUrl } from "@/lib/safe-url";
import { buildAttributedWhatsAppUrl } from "@/lib/attribution";
import { WhatsAppTriageModal, type TriageConfig } from "@/components/public/WhatsAppTriageModal";
import { GoogleReputationBooster } from "@/components/public/GoogleReputationBooster";

interface ActionButtonsProps {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  linkSectionLabel?: string;
}

export function ActionButtons({ bio, links, onTrack, linkSectionLabel }: ActionButtonsProps) {
  const [isTriageOpen, setIsTriageOpen] = useState(false);

  // Atribuição de WhatsApp inteligente
  const attributedWhatsAppHref = bio.whatsapp
    ? buildAttributedWhatsAppUrl(bio.whatsapp, bio.whatsapp_message)
    : null;

  const whatsappLabel = bio.whatsapp_button_label?.trim() || "Falar no WhatsApp";
  const whatsappSubtitle = bio.whatsapp_button_subtitle?.trim() || "Resposta rápida";

  // Configuração da Triagem de WhatsApp
  const socialConfig = (bio.social_links as Record<string, any>) || {};
  const isTriageActive = Boolean(socialConfig.triage_enabled);
  const triageConfig: TriageConfig = {
    enabled: isTriageActive,
    headerTitle: socialConfig.triage_title || "Atendimento Rápido",
    questions: socialConfig.triage_questions || [
      {
        title: "Como podemos te ajudar hoje?",
        options: ["Agendamento de Consulta / Serviço", "Preços e Valores", "Dúvidas e Informações"],
      },
      {
        title: "Qual o melhor período para você?",
        options: ["Manhã", "Tarde", "Horário Comercial"],
      },
    ],
  };

  // Configuração do Filtro 5 Estrelas do Google
  const reviewLink = links.find(
    (link) =>
      link.url?.includes("google.com") &&
      (link.title.toLowerCase().includes("avaliar") ||
        link.title.toLowerCase().includes("avaliação") ||
        link.title.toLowerCase().includes("review")),
  );
  const googleReviewUrl = socialConfig.google_review_url || reviewLink?.url || null;
  const showReputation = Boolean(googleReviewUrl || socialConfig.google_review_enabled || reviewLink);

  const validLinks = links
    .map((link) => ({ ...link, href: safeExternalUrl(link.url) }))
    .filter((link): link is typeof link & { href: string } => Boolean(link.href))
    // Oculta o link de texto simples de avaliação se o widget interativo 5 estrelas já estiver visível
    .filter((link) => (showReputation ? link.id !== reviewLink?.id : true));

  if (!attributedWhatsAppHref && validLinks.length === 0 && !showReputation) return null;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    onTrack("whatsapp_click");
    if (isTriageActive) {
      e.preventDefault();
      setIsTriageOpen(true);
    }
  };

  return (
    <section className="public-profile-actions space-y-3" aria-label="Links e formas de contato">
      {/* Botão de WhatsApp Principal com Atribuição Dinâmica ou Triagem */}
      {attributedWhatsAppHref && (
        <a
          href={attributedWhatsAppHref}
          target={isTriageActive ? undefined : "_blank"}
          rel={isTriageActive ? undefined : "noopener noreferrer"}
          onClick={handleWhatsAppClick}
          className="public-profile-action public-profile-action-whatsapp cursor-pointer"
        >
          <span className="public-profile-action-icon">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block font-semibold">{whatsappLabel}</span>
            <span className="block text-xs opacity-80">{whatsappSubtitle}</span>
          </span>
          <ArrowUpRight className="h-5 w-5 opacity-80" aria-hidden />
        </a>
      )}

      {/* Divisor de Links */}
      {linkSectionLabel && validLinks.length > 0 && (
        <div className="public-profile-link-divider" aria-hidden="true">
          <span />
          <b>{linkSectionLabel}</b>
          <span />
        </div>
      )}

      {/* Links Convencionais */}
      {validLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("link_click", link.id)}
          className="public-profile-action"
        >
          <span className="public-profile-action-icon">
            <ExternalLink className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left font-semibold">{link.title}</span>
          <ArrowUpRight className="h-5 w-5 public-profile-action-arrow" aria-hidden />
        </a>
      ))}

      {/* Filtro 5 Estrelas de Reputação no Google Maps */}
      {showReputation && (
        <GoogleReputationBooster
          businessName={bio.display_name}
          googleReviewUrl={googleReviewUrl}
          ownerWhatsApp={bio.whatsapp}
        />
      )}

      {/* Modal de Triagem Inteligente */}
      {isTriageActive && bio.whatsapp && (
        <WhatsAppTriageModal
          isOpen={isTriageOpen}
          onClose={() => setIsTriageOpen(false)}
          phone={bio.whatsapp}
          config={triageConfig}
          baseMessage={bio.whatsapp_message}
        />
      )}
    </section>
  );
}
