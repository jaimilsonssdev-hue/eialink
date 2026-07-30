import { Instagram, MapPin, MessageCircle, Share2, ShoppingBag, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { Footer } from "@/components/public-profile/Footer";
import { whatsappUrl } from "@/lib/whatsapp";
import type { TemplateComponentContext } from "../components/ComponentRegistry";

type RestaurantBioLinkProps = TemplateComponentContext & {
  supplemental?: ReactNode;
};

/**
 * Restaurant's public composition. It deliberately consumes the same bio,
 * links and catalog children supplied to every template renderer: it has no
 * direct data access and therefore stays identical in public and preview.
 */
export function RestaurantBioLink({
  bio,
  links,
  onShare,
  onTrack,
  supplemental,
}: RestaurantBioLinkProps) {
  const whatsapp = whatsappUrl(
    bio.whatsapp,
    bio.whatsapp_message || "Olá! Gostaria de fazer um pedido.",
  );
  const instagram = bio.instagram?.replace("@", "");
  const menuLink = links.find((link) => /card[aá]pio|menu/i.test(link.title));
  const locationLink = links.find((link) => /local|endere[cç]o|mapa/i.test(link.title));
  const featuredLinks = links
    .filter((link) => link.id !== menuLink?.id && link.id !== locationLink?.id)
    .slice(0, 2);

  const openWhatsapp = () => onTrack("whatsapp_click");

  return (
    <div className="restaurant-biolink">
      <section className="restaurant-hero">
        {bio.cover_url ? (
          <img
            src={bio.cover_url}
            alt={`Capa de ${bio.display_name}`}
            className="restaurant-hero-image"
            loading="eager"
            fetchPriority="high"
            style={{
              objectPosition: bio.cover_position ?? "center",
              objectFit: (bio.cover_fit ?? "cover") as "cover" | "contain",
            }}
          />
        ) : (
          <img
            src="/template-assets/restaurant-demo-cover.png"
            alt=""
            className="restaurant-hero-image"
            loading="eager"
            fetchPriority="high"
          />
        )}
        {bio.cover_overlay && (
          <div
            className="restaurant-hero-overlay"
            style={{ opacity: (bio.cover_overlay_opacity ?? 45) / 100 }}
            aria-hidden="true"
          />
        )}
        <span className="restaurant-open-status">
          <i aria-hidden="true" /> Atendimento online
        </span>
        <button
          type="button"
          className="restaurant-share"
          onClick={onShare}
          aria-label="Compartilhar página"
        >
          <Share2 size={17} aria-hidden="true" />
        </button>
        <div className="restaurant-hero-content">
          <div className="restaurant-avatar" aria-label={`Perfil de ${bio.display_name}`}>
            {bio.avatar_url ? (
              <img src={bio.avatar_url} alt="" loading="lazy" />
            ) : (
              <span>{bio.display_name.trim().slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <p className="restaurant-kicker">Restaurante</p>
          <h1>{bio.display_name}</h1>
          {bio.description && <p className="restaurant-description">{bio.description}</p>}
          <div className="restaurant-trust-row" aria-label="Informações do restaurante">
            <span>Pedidos rápidos</span>
            <span>•</span>
            <span>Atendimento pelo WhatsApp</span>
          </div>
        </div>
      </section>

      <main className="restaurant-main">
        <div className="restaurant-primary-actions">
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              onClick={openWhatsapp}
              className="restaurant-whatsapp"
            >
              <MessageCircle size={20} aria-hidden="true" />
              <span>Fazer pedido no WhatsApp</span>
              <span aria-hidden="true">→</span>
            </a>
          ) : (
            <p className="restaurant-callout">
              Informe seu WhatsApp para receber pedidos por aqui.
            </p>
          )}
          {menuLink && (
            <a
              href={menuLink.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("link", menuLink.id)}
              className="restaurant-menu-link"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              <span>{menuLink.title}</span>
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>

        {(locationLink || bio.pix_key) && (
          <section className="restaurant-quick-info" aria-label="Informações rápidas">
            {locationLink && (
              <a
                href={locationLink.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => onTrack("link", locationLink.id)}
              >
                <MapPin size={18} aria-hidden="true" />
                <span>{locationLink.title}</span>
              </a>
            )}
            {bio.pix_key && (
              <span>
                <WalletCards size={18} aria-hidden="true" /> Pix disponível
              </span>
            )}
          </section>
        )}

        {supplemental && (
          <section className="restaurant-highlights" aria-label="Destaques do cardápio">
            {supplemental}
            {menuLink && (
              <a
                href={menuLink.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => onTrack("link", menuLink.id)}
                className="restaurant-full-menu"
              >
                Ver cardápio completo <span aria-hidden="true">→</span>
              </a>
            )}
          </section>
        )}

        {(instagram || featuredLinks.length > 0) && (
          <section className="restaurant-links" aria-label="Links importantes">
            <h2>Encontre a gente</h2>
            <div className="restaurant-link-list">
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("instagram")}
                >
                  <Instagram size={19} aria-hidden="true" /> Instagram{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {featuredLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("link", link.id)}
                >
                  <ShoppingBag size={19} aria-hidden="true" /> {link.title}{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {whatsapp && (
          <section className="restaurant-final-cta">
            <div>
              <p>Pronto para pedir?</p>
              <span>Fale com a gente pelo WhatsApp.</span>
            </div>
            <a href={whatsapp} target="_blank" rel="noreferrer" onClick={openWhatsapp}>
              <MessageCircle size={18} aria-hidden="true" /> Pedir agora
            </a>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
