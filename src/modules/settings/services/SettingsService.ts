import { supabase } from "@/integrations/supabase/client";
export const SettingsService = {
  async getProfile() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sessão inválida.");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async updateProfile(data: Record<string, unknown>) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sessão inválida.");
    const { error } = await supabase.from("profiles").update(data).eq("id", auth.user.id);
    if (error) throw error;
  },
};
