import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

/**
 * 1. Torna a página oficial em 1 clique:
 * Remove a flag de demonstração e limpa o banner de demo.
 */
export const makePageOfficialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string }) => {
    if (!data.pageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Busca a página e confirma titularidade
    const { data: page, error: fetchErr } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("id", data.pageId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !page) {
      throw new Error("Página não encontrada ou sem permissão de edição.");
    }

    const currentSocial = (page.social_links as Record<string, any>) || {};
    const updatedSocial = {
      ...currentSocial,
      is_demo: false,
    };
    delete updatedSocial.claim_token;

    let description = page.description || "";
    if (description.startsWith("[DEMO] ")) {
      description = description.replace("[DEMO] ", "").trim();
    } else if (description.startsWith("[DEMO]")) {
      description = description.replace("[DEMO]", "").trim();
    }

    // 2. Atualiza bio_pages
    const { error: updateErr } = await supabase
      .from("bio_pages")
      .update({
        social_links: updatedSocial,
        description,
        published: true,
      })
      .eq("id", data.pageId)
      .eq("user_id", userId);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // 3. Atualiza radar de prospecção se houver registro vinculado
    try {
      const { data: companies } = await supabase
        .from("prospected_companies")
        .select("id, notes")
        .ilike("notes", `%${data.pageId}%`);

      if (companies && companies.length > 0) {
        for (const comp of companies) {
          const newNotes = comp.notes ? `${comp.notes}\n[Página Oficializada]` : "[Página Oficializada]";
          await supabase
            .from("prospected_companies")
            .update({ status: "cliente", notes: newNotes })
            .eq("id", comp.id);
        }
      }
    } catch (radarErr) {
      console.warn("Aviso ao atualizar radar na oficialização:", radarErr);
    }

    return { success: true, slug: page.slug, displayName: page.display_name };
  });

/**
 * 2. Transfere a titularidade da página para o cliente:
 * - Se o cliente já tiver conta cadastrada com o e-mail: transfere imediatamente a propriedade da página.
 * - Se o cliente ainda não tiver conta: gera o token exclusivo de resgate e link para onboarding no WhatsApp.
 */
export const transferPageOwnershipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pageId: string; targetEmail: string }) => {
    const email = data.targetEmail?.trim().toLowerCase();
    if (!data.pageId) throw new Error("ID da página é obrigatório.");
    if (!email || !email.includes("@")) throw new Error("E-mail do cliente inválido.");
    return { pageId: data.pageId, targetEmail: email };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const adminClient = getServiceSupabase() || supabase;

    // 1. Verifica se a página pertence ao solicitante
    const { data: page, error: fetchErr } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("id", data.pageId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !page) {
      throw new Error("Página não encontrada ou sem permissão.");
    }

    // 2. Tenta chamar o RPC nativo transfer_bio_page se disponível
    try {
      const rpcClient = supabase as any;
      const { data: rpcRes, error: rpcErr } = await rpcClient.rpc("transfer_bio_page", {
        _page_id: data.pageId,
        _target_email: data.targetEmail,
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return {
          transferred: true,
          targetUser: {
            id: rpcRes.target_user_id,
            name: rpcRes.target_name,
            email: rpcRes.target_email,
          },
        };
      }
    } catch {
      // Segue para a verificação direta abaixo
    }

    // 3. Busca o perfil do usuário pelo e-mail
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .ilike("email", data.targetEmail)
      .maybeSingle();

    if (targetProfile) {
      // Usuário já cadastrado! Transfere diretamente a titularidade
      const currentSocial = (page.social_links as Record<string, any>) || {};
      const updatedSocial = {
        ...currentSocial,
        is_demo: false,
        transferred_at: new Date().toISOString(),
        transferred_from: userId,
      };
      delete updatedSocial.claim_token;
      delete updatedSocial.claim_email;

      const { error: transferErr } = await adminClient
        .from("bio_pages")
        .update({
          user_id: targetProfile.id,
          social_links: updatedSocial,
        })
        .eq("id", data.pageId);

      if (transferErr) {
        throw new Error(`Falha ao transferir página: ${transferErr.message}`);
      }

      // Atualiza status no radar de prospecção
      try {
        await supabase
          .from("prospected_companies")
          .update({ status: "cliente" })
          .ilike("notes", `%${data.pageId}%`);
      } catch (err) {
        console.warn("Aviso ao atualizar radar:", err);
      }

      return {
        transferred: true,
        targetUser: {
          id: targetProfile.id,
          name: targetProfile.full_name,
          email: targetProfile.email,
        },
      };
    }

    // 4. Usuário ainda NÃO tem conta cadastrada:
    // Gera token de resgate seguro para que ele crie a conta e assuma o controle
    const claimToken = crypto.randomUUID();
    const currentSocial = (page.social_links as Record<string, any>) || {};
    const updatedSocial = {
      ...currentSocial,
      claim_token: claimToken,
      claim_email: data.targetEmail,
      is_demo: false,
    };

    const { error: tokenErr } = await supabase
      .from("bio_pages")
      .update({
        social_links: updatedSocial,
      })
      .eq("id", data.pageId)
      .eq("user_id", userId);

    if (tokenErr) {
      throw new Error(`Erro ao gerar link de resgate: ${tokenErr.message}`);
    }

    return {
      transferred: false,
      claimToken,
      targetEmail: data.targetEmail,
    };
  });

/**
 * 3. Busca informações públicas e seguras de prévia para a tela de resgate (/resgatar?token=...)
 */
export const getClaimPageInfoFn = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => {
    if (!data.token?.trim()) throw new Error("Token de resgate obrigatório.");
    return { token: data.token.trim() };
  })
  .handler(async ({ data }) => {
    const admin = getServiceSupabase();
    if (!admin) {
      throw new Error("Serviço temporariamente indisponível.");
    }

    // 1. Tenta RPC nativo se disponível
    try {
      const rpcClient = admin as any;
      const { data: rpcRes, error: rpcErr } = await rpcClient.rpc("get_claim_page_info", {
        _claim_token: data.token,
      });
      if (!rpcErr && rpcRes && rpcRes.valid) {
        return { valid: true, page: rpcRes };
      }
    } catch {
      // Segue para consulta direta
    }

    // 2. Consulta direta usando filtro JSON
    const { data: page, error } = await admin
      .from("bio_pages")
      .select("id, display_name, slug, theme, cover_url, avatar_url, description, social_links")
      .filter("social_links->>claim_token", "eq", data.token)
      .maybeSingle();

    if (error || !page) {
      return { valid: false, message: "Link de resgate inválido ou expirado." };
    }

    const social = (page.social_links as Record<string, any>) || {};

    return {
      valid: true,
      page: {
        id: page.id,
        displayName: page.display_name,
        slug: page.slug,
        theme: page.theme,
        coverUrl: page.cover_url,
        avatarUrl: page.avatar_url,
        description: page.description,
        targetEmail: social.claim_email || null,
      },
    };
  });

/**
 * 4. Reivindica e transfere a titularidade da página para o usuário conectado
 */
export const claimPageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token: string }) => {
    if (!data.token?.trim()) throw new Error("Token de resgate obrigatório.");
    return { token: data.token.trim() };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const admin = getServiceSupabase();
    if (!admin) {
      throw new Error("Serviço temporariamente indisponível.");
    }

    // 1. Tenta RPC nativo se disponível
    try {
      const rpcClient = admin as any;
      const { data: rpcRes, error: rpcErr } = await rpcClient.rpc("claim_bio_page", {
        _claim_token: data.token,
      });
      if (!rpcErr && rpcRes && rpcRes.success) {
        return {
          success: true,
          pageId: rpcRes.page_id,
          slug: rpcRes.slug,
          displayName: rpcRes.display_name,
        };
      }
    } catch {
      // Segue para atualização direta
    }

    // 2. Localiza a página com o token
    const { data: page, error: fetchErr } = await admin
      .from("bio_pages")
      .select("*")
      .filter("social_links->>claim_token", "eq", data.token)
      .maybeSingle();

    if (fetchErr || !page) {
      throw new Error("Link de resgate inválido ou página já reivindicada.");
    }

    const social = (page.social_links as Record<string, any>) || {};
    const updatedSocial = {
      ...social,
      is_demo: false,
      claimed_at: new Date().toISOString(),
      claimed_by: userId,
    };
    delete updatedSocial.claim_token;
    delete updatedSocial.claim_email;

    // 3. Transfere a página para o novo usuário
    const { error: updateErr } = await admin
      .from("bio_pages")
      .update({
        user_id: userId,
        social_links: updatedSocial,
      })
      .eq("id", page.id);

    if (updateErr) {
      throw new Error(`Falha ao vincular página: ${updateErr.message}`);
    }

    // 4. Marca como cliente no radar se houver oportunidade vinculada
    try {
      await admin
        .from("prospected_companies")
        .update({ status: "cliente" })
        .ilike("notes", `%${page.id}%`);
    } catch (radarErr) {
      console.warn("Aviso ao atualizar radar pós resgate:", radarErr);
    }

    return {
      success: true,
      pageId: page.id,
      slug: page.slug,
      displayName: page.display_name,
    };
  });

