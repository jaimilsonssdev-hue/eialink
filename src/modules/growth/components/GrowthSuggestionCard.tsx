import { ArrowUpRight, Sparkles } from "lucide-react";

export type GrowthSuggestionCardProps = {
  businessType: "restaurant" | "clinic" | "lawyer" | "store" | "creator" | "provider";
  action: "products" | "services";
  currentCount: number;
};

const suggestions = {
  restaurant: ["CardÃ¡pio online", "Sistema de pedidos"],
  clinic: ["Agendamento", "Site profissional"],
  lawyer: ["Site institucional", "CaptaÃ§Ã£o de leads"],
  store: ["Loja virtual", "Google Shopping"],
  creator: ["Landing pages", "Ã�rea de cursos"],
  provider: ["Agendamentos", "OrÃ§amentos online"],
};

export function GrowthSuggestionCard({
  businessType,
  action,
  currentCount,
}: GrowthSuggestionCardProps) {
  const [primary, secondary] = suggestions[businessType];
  return (
    <aside className="growth-suggestion-card" aria-label="SugestÃ£o de crescimento">
      <Sparkles aria-hidden="true" size={18} />
      <div>
        <p className="text-sm font-semibold">Pronto para crescer?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          VocÃª jÃ¡ organizou {currentCount} {action === "products" ? "produtos" : "serviÃ§os"}.
          Considere {primary.toLowerCase()} ou {secondary.toLowerCase()}.
        </p>
      </div>
      <ArrowUpRight aria-hidden="true" size={18} />
    </aside>
  );
}
