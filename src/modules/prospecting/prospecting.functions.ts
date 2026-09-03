import { createServerFn } from "@tanstack/react-start";
import { searchGoogleMapsAndInstagram } from "./LiveProspectingEngine";
import type { ProspectDraft } from "./types";

export const runLiveProspecting = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { niche: string; city: string; limit?: number }) => {
      if (!data.niche || !data.city) {
        throw new Error("Nicho e cidade são obrigatórios para a busca.");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<ProspectDraft[]> => {
    return await searchGoogleMapsAndInstagram(data.niche, data.city, data.limit ?? 15);
  });

