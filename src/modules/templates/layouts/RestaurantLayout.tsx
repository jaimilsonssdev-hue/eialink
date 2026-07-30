import type { ReactNode } from "react";
import { ArrowUpRight, Instagram, MapPin, MessageCircle, UtensilsCrossed } from "lucide-react";
import type { CatalogItem } from "@/modules/products/types";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

export class RestaurantLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "restaurant" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "restaurant";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const menu = products.filter((p) => p.active);
    const secondary = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    return (
      <div className="niche-restaurant">
        <header className="niche-restaurant-hero">
          {bio.cover_url ? (
            <img src={bio.cover_url} alt="" className="niche-restaurant-hero-img" loading="eager" />
          ) : (
            <div className="niche-restaurant-hero-fallback" aria-hidden />
          )}
          <div className="niche-restaurant-hero-overlay" aria-hidden />
          <button
            type="button"
            onClick={onShare}
            className="niche-restaurant-share"
            aria-label="Compartilhar página"
          >
            Compartilhar
          </button>
          <div className="niche-restaurant-hero-content">
            <span className="niche-eyebrow">
              <UtensilsCrossed size={14} aria-hidden /> Casa
            </span>
            <h1 className="niche-restaurant-name">{bio.display_name}</h1>
            {bio.description && (
              <p className="niche-restaurant-lead">{bio.description}</p>
            )}
            <div className="niche-restaurant-meta">
              {insta && (
                <a
                  href={`https://instagram.com/${insta}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("instagram_click")}
                >
                  <Instagram size={14} aria-hidden /> @{insta}
                </a>
              )}
              <span className="niche-restaurant-meta-dot" aria-hidden />
              <span className="opacity-80">
                <MapPin size={14} aria-hidden className="inline" /> Reservas e pedidos
              </span>
            </div>
          </div>
        </header>

        {whats && (
          <a
            href={whatsappUrl(whats, bio.whatsapp_message || "Olá, gostaria de fazer um pedido")}
            target="_blank"
            rel="noreferrer"
            onClick={() => onTrack("whatsapp_click")}
            className="niche-restaurant-cta"
          >
            <MessageCircle size={20} aria-hidden />
            <span className="flex-1 text-left">
              <span className="block text-sm font-bold uppercase tracking-wider">Fazer pedido</span>
              <span className="block text-xs opacity-90">Pelo WhatsApp — resposta rápida</span>
            </span>
            <ArrowUpRight size={20} aria-hidden />
          </a>
        )}

        {menu.length > 0 && (
          <section className="niche-restaurant-menu" aria-label="Cardápio">
            <div className="niche-section-title">
              <span className="niche-section-rule" aria-hidden />
              <h2>Cardápio</h2>
              <span className="niche-section-rule" aria-hidden />
            </div>
            <ul className="niche-restaurant-menu-list">
              {menu.map((item) => (
                <li key={item.id} className="niche-restaurant-dish">
                  <div className="niche-restaurant-dish-img">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="niche-restaurant-dish-fallback" aria-hidden>
                        <UtensilsCrossed size={28} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="niche-restaurant-dish-name">{item.name}</h3>
                      <span className="niche-restaurant-dots" aria-hidden />
                      {item.price !== null && (
                        <span className="niche-restaurant-dish-price">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="niche-restaurant-dish-desc">{item.description}</p>
                    )}
                    {item.button_url && (
                      <a
                        href={item.button_url}
                        target="_blank"
                        rel="noreferrer"
                        className="niche-restaurant-dish-cta"
                      >
                        {item.button_label} <ArrowUpRight size={14} aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {secondary.length > 0 && (
          <section className="niche-restaurant-links" aria-label="Mais">
            <p className="niche-eyebrow">Mais da casa</p>
            <ul>
              {secondary.map((link: PublicLink) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("link_click", link.id)}
                  >
                    <span>{link.title}</span>
                    <ArrowUpRight size={16} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {bio.pix_key && (
          <div className="niche-restaurant-pix">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}

        {supplemental}
        <Footer />
      </div>
    );
  }
}

export type _Ref = CatalogItem;
