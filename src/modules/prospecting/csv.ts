import {
  buildDedupeKey,
  normalizeEmail,
  normalizeInstagram,
  normalizeName,
  normalizeNumber,
  normalizePhone,
  normalizeText,
  normalizeWebsite,
  priorityFromScore,
  scoreCompany,
  stripAccents,
} from "./scoring";
import type { ProspectDraft } from "./types";

export type CsvRowPreview = {
  line: number;
  draft: ProspectDraft | null;
  error: string | null;
  duplicateOf: "arquivo" | "banco" | null;
};

const FIELD_ALIASES: Record<string, string[]> = {
  name: ["nome", "name", "empresa", "razao social", "estabelecimento", "titulo"],
  niche: ["nicho", "categoria", "segmento", "ramo", "tipo"],
  city: ["cidade", "city", "municipio"],
  state: ["estado", "uf", "state"],
  phone: ["telefone", "phone", "fone", "contato"],
  whatsapp: ["whatsapp", "whats", "celular", "zap"],
  email: ["email", "e-mail", "mail"],
  instagram: ["instagram", "insta", "perfil"],
  website: ["site", "website", "url", "pagina"],
  rating: ["nota", "rating", "avaliacao", "estrelas"],
  reviews_count: ["avaliacoes", "reviews", "qtd avaliacoes", "numero de avaliacoes"],
  notes: ["observacao", "observacoes", "notas", "notes"],
};

function headerKey(header: string) {
  const clean = stripAccents(header).toLowerCase().replace(/[_-]+/g, " ").trim();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => clean === alias || clean.includes(alias))) return field;
  }
  return null;
}

/** Parser CSV tolerante a aspas, ponto e vírgula e quebras de linha internas. */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  const text = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const delimiter = (text.split("\n")[0]?.match(/;/g)?.length ?? 0) > 0 ? ";" : ",";

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      if (row.some((cell) => cell.trim().length)) rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  row.push(value);
  if (row.some((cell) => cell.trim().length)) rows.push(row);
  return rows;
}

export function buildPreview(content: string, existingKeys: Set<string>): CsvRowPreview[] {
  const rows = parseCsv(content);
  if (!rows.length) return [];
  const headers = rows[0].map(headerKey);
  if (!headers.includes("name")) {
    return [
      {
        line: 1,
        draft: null,
        error: "Cabeçalho sem coluna de nome da empresa (ex.: nome, empresa).",
        duplicateOf: null,
      },
    ];
  }

  const seen = new Set<string>();
  return rows.slice(1).map((cells, index) => {
    const record: Record<string, string> = {};
    headers.forEach((field, position) => {
      if (field) record[field] = cells[position] ?? "";
    });

    const name = normalizeName(record.name);
    if (!name) {
      return { line: index + 2, draft: null, error: "Nome vazio.", duplicateOf: null };
    }

    const whatsapp = normalizePhone(record.whatsapp);
    const phone = normalizePhone(record.phone) ?? whatsapp;
    const instagram = normalizeInstagram(record.instagram);
    const website = normalizeWebsite(record.website);
    const city = normalizeText(record.city);

    const base = {
      name,
      niche: normalizeText(record.niche),
      city,
      state: normalizeText(record.state)?.toUpperCase().slice(0, 2) ?? null,
      phone,
      whatsapp: whatsapp ?? phone,
      email: normalizeEmail(record.email),
      instagram,
      website,
      has_website: Boolean(website),
      rating: normalizeNumber(record.rating),
      reviews_count: normalizeNumber(record.reviews_count)
        ? Math.round(normalizeNumber(record.reviews_count)!)
        : null,
      notes: normalizeText(record.notes),
      source: "csv",
      status: "novo" as const,
    };

    const score = scoreCompany(base);
    const dedupe_key = buildDedupeKey({
      name: base.name,
      city: base.city,
      whatsapp: base.whatsapp,
      phone: base.phone,
      instagram: base.instagram,
    });

    const duplicateOf = existingKeys.has(dedupe_key)
      ? ("banco" as const)
      : seen.has(dedupe_key)
        ? ("arquivo" as const)
        : null;
    seen.add(dedupe_key);

    return {
      line: index + 2,
      draft: { ...base, score, priority: priorityFromScore(score), dedupe_key },
      error: null,
      duplicateOf,
    };
  });
}
