/**
 * Pares tipográficos disponíveis para as páginas públicas.
 * As famílias já são carregadas no <head> do site (Google Fonts), portanto
 * nenhuma requisição extra é necessária ao trocar o par.
 */
export type FontPairId = "moderna" | "elegante" | "marcante" | "corporativa";

export interface FontPair {
  id: FontPairId;
  label: string;
  description: string;
  display: string;
  body: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: "moderna",
    label: "Moderna",
    description: "Clean e atual",
    display: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "elegante",
    label: "Elegante",
    description: "Luxo e estética",
    display: '"Playfair Display", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "marcante",
    label: "Marcante",
    description: "Jovem e impactante",
    display: '"Outfit", "Poppins", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "corporativa",
    label: "Corporativa",
    description: "Séria e confiável",
    display: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
    body: '"Roboto", ui-sans-serif, system-ui, sans-serif',
  },
];

export function findFontPair(id?: string | null): FontPair | null {
  if (!id) return null;
  return FONT_PAIRS.find((pair) => pair.id === id) ?? null;
}
