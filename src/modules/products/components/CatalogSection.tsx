import { ArrowUpRight, PackageOpen } from "lucide-react";
import type { CatalogItem } from "../types";

export function CatalogSection({ items }: { items: CatalogItem[] }) {
  const activeItems = items.filter((item) => item.active);
  if (!activeItems.length) return null;
  return (
    <section className="public-catalog" aria-label="Produtos e serviÃ§os">
      <p className="public-catalog-title">Produtos e serviÃ§os</p>
      <div className="public-catalog-grid">
        {activeItems.map((item) => (
          <article key={item.id} className="public-catalog-card">
            {item.image_url ? (
              <img src={item.image_url} alt="" loading="lazy" />
            ) : (
              <PackageOpen aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold">{item.name}</p>
              {item.description && <p className="mt-1 text-sm opacity-75">{item.description}</p>}
              {item.price !== null && (
                <p className="mt-2 text-sm font-semibold">
                  R$ {item.price.toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
            {item.button_url && (
              <a
                href={item.button_url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${item.button_label}: ${item.name}`}
              >
                <ArrowUpRight size={17} />
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
