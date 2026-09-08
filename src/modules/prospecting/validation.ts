import { z } from "zod";

/**
 * Aceita apenas texto "limpo": letras (com acentos), números, espaço e os
 * separadores comuns de nomes de cidade/nicho. Qualquer caractere usado em
 * scripts, HTML ou injeção (< > { } ; $ ` " ' \ / | = etc.) é rejeitado.
 */
const SAFE_TEXT = /^[\p{L}\p{N}\s.,\-&()]+$/u;

const SUSPICIOUS = /(<\s*\/?\s*\w|javascript:|data:text|on\w+\s*=|--|;|\$\{|\bselect\b\s+.*\bfrom\b|\bunion\b\s+\bselect\b)/i;

function safeText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(2, `${label} deve ter pelo menos 2 caracteres.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .regex(SAFE_TEXT, `${label} contém caracteres não permitidos.`)
    .refine((value) => !SUSPICIOUS.test(value), `${label} contém conteúdo suspeito e foi bloqueado.`);
}

export const prospectingSearchSchema = z.object({
  niche: safeText("O nicho", 60),
  city: safeText("A cidade", 80),
  limit: z.number().int().min(1).max(50).optional(),
});

export type ProspectingSearchInput = z.infer<typeof prospectingSearchSchema>;

export function validateProspectingSearch(input: { niche: string; city: string; limit?: number }) {
  const parsed = prospectingSearchSchema.safeParse(input);
  if (parsed.success) return { ok: true as const, data: parsed.data };
  return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
}
