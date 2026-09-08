import { createServerFn } from "@tanstack/react-start";
import { searchGoogleMapsAndInstagram, lookupBusinessProfile } from "./LiveProspectingEngine";
import { prospectingSearchSchema } from "./validation";
import type { ProspectDraft } from "./types";

export const runLiveProspecting = createServerFn({ method: "POST" })
  .inputValidator((data: { niche: string; city: string; limit?: number }) =>
    prospectingSearchSchema.parse(data),
  )
  .handler(async ({ data }): Promise<ProspectDraft[]> => {
    return await searchGoogleMapsAndInstagram(data.niche, data.city, data.limit ?? 15);
  });

export const lookupBusinessProfileFn = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    const query = (data?.query ?? "").trim();
    if (!query) {
      throw new Error("Termo ou link de busca obrigatório.");
    }
    if (query.length > 200 || /(<\s*\/?\s*\w|javascript:|on\w+\s*=)/i.test(query)) {
      throw new Error("Termo de busca inválido.");
    }
    return { query };
  })
  .handler(async ({ data }): Promise<ProspectDraft[]> => {
    return await lookupBusinessProfile(data.query);
  });
