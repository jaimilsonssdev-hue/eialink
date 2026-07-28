import { Sparkles } from "lucide-react";
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
              <span className="mt-4 inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Em breve
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
