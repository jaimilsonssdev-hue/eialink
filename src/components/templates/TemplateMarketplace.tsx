import { Eye, Sparkles } from "lucide-react";
const templates = [
  "Restaurante",
  "Clínica",
  "Loja",
  "Prestador",
  "Influenciador",
  "Dentista",
  "Advogado",
  "Corretor",
  "Academia",
  "Salão",
];
export function TemplateMarketplace() {
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[color:var(--primary)]">
            Template atual
          </p>
          <h2 className="mt-1 text-2xl font-bold">Escolha um visual que combina com você</h2>
        </div>
        <Sparkles className="h-5 w-5 text-[color:var(--primary)]" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((name, i) => (
          <article
            key={name}
            className="overflow-hidden rounded-2xl border border-border bg-surface transition-transform hover:-translate-y-1"
          >
            <img
              src="/templates/premium-template-collection.png"
              loading="lazy"
              alt={`Mockup do template ${name}`}
              className="h-32 w-full object-cover"
              style={{ objectPosition: `${(i % 5) * 25}% ${Math.floor(i / 5) * 100}%` }}
            />
            <div className="p-4">
              <h3 className="font-semibold">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Visual profissional pronto para personalizar.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="btn-secondary flex-1 px-3 py-2 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Visualizar
                </button>
                <button className="btn-primary flex-1 px-3 py-2 text-xs">Utilizar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
