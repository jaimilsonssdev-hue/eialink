import { useState } from "react";
import { ArrowUpRight, ImageOff, PackageOpen } from "lucide-react";
import type { CatalogItem } from "../types";
import { safeExternalUrl } from "@/lib/safe-url";

export function CatalogSection({ items }: { items: CatalogItem[] }) {
  const activeItems = items.filter((item) => item.active);
  if (!activeItems.length) return null;
  return (
    <section className="public-catalog" aria-label="Produtos e serviços">
      <p className="public-catalog-title">Produtos e serviços</p>
      <div className="public-catalog-grid">
        {activeItems.map((item) => {
          const href = safeExternalUrl(item.button_url);
          return (
            <article
              key={item.id}
              className={`public-catalog-card public-catalog-card-${item.type}`}
            >
              <CatalogImage imageUrl={item.image_url} name={item.name} />
              <div>
                <span className="public-catalog-type">
                  {item.type === "product" ? "Produto" : "Serviço"}
                </span>
                <p className="font-semibold">{item.name}</p>
                {item.description && <p className="mt-1 text-sm opacity-75">{item.description}</p>}
                {item.price !== null && (
                  <p className="mt-2 text-sm font-semibold">
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${item.button_label}: ${item.name}`}
                >
                  <span>{item.button_label}</span>
                  <ArrowUpRight size={17} />
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CatalogImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl) return <PackageOpen aria-hidden="true" />;
  if (failed) {
    return (
      <span
        className="public-catalog-image-fallback"
        aria-label={`Imagem indisponível para ${name}`}
      >
        <ImageOff aria-hidden="true" />
      </span>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
