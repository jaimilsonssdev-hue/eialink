import type { ReactNode } from "react";
import { ArrowUpRight, Instagram, MessageCircle, ShoppingBag, Tag } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

export class StorefrontLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "storefront" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "storefront";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const items = products.filter((p) => p.active);
    const productItems = items.filter((i) => i.type === "product");
    const other = items.filter((i) => i.type !== "product");
    const secondary = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    return (
      <div className="niche-store">
        <header className="niche-store-hero">
          {bio.cover_url ? (
            <img src={bio.cover_url} alt="" className="niche-store-hero-img" loading="eager" />
          ) : (
            <img src="/template-assets/store-demo-cover.png" alt="" className="niche-store-hero-img" loading="eager" />
          )}
          <div className="niche-store-hero-bar">
            <div className="flex items-center gap-2.5">
              {bio.avatar_url ? (
                <img src={bio.avatar_url} alt="" className="niche-store-avatar" />
              ) : (
                <div className="niche-store-avatar niche-store-avatar-fallback" aria-hidden>
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">{bio.display_name}</p>
                <p className="niche-store-tag">
                  <Tag size={11} aria-hidden /> Loja online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onShare}
              className="niche-store-share"
              aria-label="Compartilhar"
            >
              Compartilhar
            </button>
          </div>
          <div className="niche-store-hero-copy">
            <p className="niche-store-promo">Novidades da vitrine</p>
            {bio.description && <p className="niche-store-desc">{bio.description}</p>}
          </div>
        </header>

        {productItems.length > 0 && (
          <section className="niche-store-section" aria-label="Produtos">
            <div className="niche-store-section-head">
              <h2>Produtos</h2>
              <span className="niche-store-count">{productItems.length}</span>
            </div>
            <div className="niche-store-grid">
              {productItems.map((item) => (
                <article key={item.id} className="niche-store-card">
                  <div className="niche-store-card-media">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="niche-store-card-fallback" aria-hidden>
                        <ShoppingBag size={26} />
                      </div>
                    )}
                  </div>
                  <div className="niche-store-card-body">
                    <p className="niche-store-card-name">{item.name}</p>
                    {item.price !== null && (
                      <p className="niche-store-card-price">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                    {item.button_url ? (
                      <a
                        href={item.button_url}
                        target="_blank"
                        rel="noreferrer"
                        className="niche-store-card-cta"
                      >
                        {item.button_label}
                        <ArrowUpRight size={13} aria-hidden />
                      </a>
                    ) : whats ? (
                      <a
                        href={`https://wa.me/${whats}?text=${encodeURIComponent(`Olá! Tenho interesse em ${item.name}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => onTrack("whatsapp_click")}
                        className="niche-store-card-cta"
                      >
                        Comprar
                        <ArrowUpRight size={13} aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {other.length > 0 && (
          <section className="niche-store-section" aria-label="Serviços">
            <div className="niche-store-section-head">
              <h2>Serviços</h2>
            </div>
            <ul className="niche-store-services">
              {other.map((item) => (
                <li key={item.id}>
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    {item.description && (
                      <p className="text-xs opacity-80">{item.description}</p>
                    )}
                  </div>
                  {item.price !== null && (
                    <span className="niche-store-services-price">
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(secondary.length > 0 || whats || insta) && (
          <section className="niche-store-section" aria-label="Contato">
            <div className="niche-store-section-head">
              <h2>Contato</h2>
            </div>
            <div className="niche-store-contact">
              {whats && (
                <a
                  href={whatsappUrl(bio.whatsapp, bio.whatsapp_message)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="niche-store-contact-primary"
                >
                  <MessageCircle size={16} aria-hidden />
                  {bio.whatsapp_button_label || "Falar com a loja"}
                </a>
              )}
              {insta && (
                <a
                  href={`https://instagram.com/${insta}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("instagram_click")}
                  className="niche-store-contact-ghost"
                >
                  <Instagram size={16} aria-hidden /> @{insta}
                </a>
              )}
              {secondary.map((link: PublicLink) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("link_click", link.id)}
                  className="niche-store-contact-ghost"
                >
                  {link.title}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              ))}
            </div>
          </section>
        )}

        {bio.pix_key && (
          <div className="niche-store-pix">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}

        {supplemental}
        <Footer />
      </div>
    );
  }
}
