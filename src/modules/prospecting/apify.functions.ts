import { createServerFn } from "@tanstack/react-start";
import { fetchInstagramProfileViaApify, type ApifyInstagramProfile } from "./ApifyInstagramService";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchInstagramProfileWithApifyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { handleOrUrl: string; overrideToken?: string }) => {
    const handleOrUrl = (data?.handleOrUrl ?? "").trim();
    if (!handleOrUrl) {
      throw new Error("Perfil ou link do Instagram é obrigatório.");
    }
    return {
      handleOrUrl,
      overrideToken: data?.overrideToken,
    };
  })
  .handler(async ({ data }): Promise<ApifyInstagramProfile | null> => {
    return await fetchInstagramProfileViaApify(data.handleOrUrl, data.overrideToken);
  });
