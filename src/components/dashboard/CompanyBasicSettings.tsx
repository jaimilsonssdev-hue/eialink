import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Store,
  MessageCircle,
  Instagram,
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  QrCode,
  CreditCard,
} from "lucide-react";
import { MediaUploader } from "@/components/page-builder/MediaUploader";
import { publicPageUrl } from "@/lib/public-page-url";
import { formatPhoneDisplay, sanitizePhoneDigits } from "@/modules/settings/services/CommercialSettingsService";
import { GoogleCalendarIntegrationCard } from "@/components/dashboard/GoogleCalendarIntegrationCard";

export function CompanyBasicSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["company-basic-settings"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão inválida.");

      const [{ data: profile }, { data: bioPages }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
        supabase
          .from("bio_pages")
          .select("*")
          .eq("user_id", auth.user.id)
          .order("updated_at", { ascending: false }),
      ]);

      const realPage =
        (bioPages ?? []).find((p) => !(p.social_links as any)?.is_demo) ?? bioPages?.[0] ?? null;

      return {
        userId: auth.user.id,
        profile,
        bio: realPage,
      };
    },
  });

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [instagram, setInstagram] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.bio) {
      const b = data.bio;
      const social = (b.social_links as Record<string, unknown>) || {};
      setCompanyName(b.display_name || data.profile?.company_name || "");
      setDescription(b.description || "");
      setWhatsapp(formatPhoneDisplay(b.whatsapp || data.profile?.whatsapp || ""));
      setWhatsappMessage(
        b.whatsapp_message || `Olá! Gostaria de mais informações sobre ${b.display_name || "seus serviços"}.`,
      );
      setInstagram(b.instagram || data.profile?.instagram || "");
      setPixKey(b.pix_key || "");
      setAvatarUrl(b.avatar_url || null);
      setCoverUrl(b.cover_url || null);
      setAddress((social.address as string) || data.profile?.city || "");
      setOpeningHours((social.opening_hours as string) || "");
    } else if (data?.profile) {
      const p = data.profile;
      setCompanyName(p.company_name || "");
      setWhatsapp(formatPhoneDisplay(p.whatsapp || ""));
      setInstagram(p.instagram || "");
    }
  }, [data]);

  const publicUrl = data?.bio ? publicPageUrl(data.bio.slug) : null;

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const cleanPhone = sanitizePhoneDigits(whatsapp);
      const cleanInsta = instagram.replace(/^@/, "").trim();

      // 1. Atualiza Perfil
      if (data?.userId) {
        await supabase
          .from("profiles")
          .update({
            company_name: companyName.trim(),
            whatsapp: cleanPhone,
            instagram: cleanInsta || null,
          })
          .eq("id", data.userId);
      }

      // 2. Atualiza Bio Page Ativa do Cliente
      if (data?.bio?.id) {
        const currentSocial = (data.bio.social_links as Record<string, unknown>) || {};
        const updatedSocial = {
          ...currentSocial,
          address: address.trim() || undefined,
          opening_hours: openingHours.trim() || undefined,
          instagram: cleanInsta || undefined,
        };

        const { error: bioErr } = await supabase
          .from("bio_pages")
          .update({
            display_name: companyName.trim(),
            description: description.trim() || null,
            whatsapp: cleanPhone || null,
            whatsapp_message: whatsappMessage.trim() || null,
            instagram: cleanInsta || null,
            pix_key: pixKey.trim() || null,
            avatar_url: avatarUrl,
            cover_url: coverUrl,
            social_links: updatedSocial as any,
          })
          .eq("id", data.bio.id);

        if (bioErr) throw bioErr;
      }

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["company-basic-settings"] });
      queryClient.invalidateQueries({ queryKey: ["bio-me"] });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      queryClient.invalidateQueries({ queryKey: ["unified-page-editor"] });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar as alterações. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner Superior com Link Oficial */}
      {publicUrl && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Sua Presença Oficial na Web
              </p>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
              >
                <span>{publicUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted/40 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Ver Meu Site</span>
            </a>
          </div>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Seção 1: Identidade da Empresa */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Store className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Identidade do Negócio
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nome da Empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Pizzaria Forno Nobre"
                required
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Slogan / Descrição Curta
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: A melhor pizza artesanal da região com entrega rápida"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              />
            </div>
          </div>

          {/* Upload e Enquadramento de Fotos */}
          <div className="pt-2 border-t border-border/40 grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Logo / Foto de Perfil (1:1)
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">
                Aparece no topo do site e no ícone do aplicativo.
              </p>
              <MediaUploader
                label="Logo ou Foto Principal"
                value={avatarUrl}
                variant="avatar"
                companyName={companyName}
                onChange={setAvatarUrl}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Foto de Capa do Site (16:9)
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">
                Banner de destaque exibido na entrada do seu site.
              </p>
              <MediaUploader
                label="Foto de Capa (Banner)"
                value={coverUrl}
                variant="cover"
                companyName={companyName}
                onChange={setCoverUrl}
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Atendimento e Contato */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              WhatsApp & Canais de Atendimento
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                WhatsApp de Atendimento (com DDD)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Instagram (@usuario)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={instagram.replace(/^@/, "")}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="suaempresa"
                  className="w-full h-10 pl-8 pr-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mensagem Pré-configurada do WhatsApp
            </label>
            <input
              type="text"
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder="Ex: Olá! Vim pelo site e gostaria de agendar um atendimento."
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Essa mensagem já vem escrita quando o cliente clica no botão de WhatsApp do seu site.
            </p>
          </div>
        </div>

        {/* Seção 3: Endereço & Horários */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Localização & Horários de Funcionamento
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Endereço da Empresa</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Principal, 1200 - Centro"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Horário de Atendimento</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Ex: Seg a Sáb: 09h às 19h"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Chave Pix para Recebimentos Rápidos</span>
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
            />
          </div>
        </div>

        {/* Mensagens de Feedback e Botão Salvar */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Alterações salvas com sucesso! Seu site oficial já foi atualizado.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando Dados…</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Dados da Empresa</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sincronização Automática com o Google Agenda */}
      {data?.bio?.id && (
        <div className="pt-2">
          <GoogleCalendarIntegrationCard bioPageId={data.bio.id} />
        </div>
      )}
    </div>
  );
}

