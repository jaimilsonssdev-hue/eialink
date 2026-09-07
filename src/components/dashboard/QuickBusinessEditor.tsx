import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Store,
  MessageCircle,
  Instagram,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

interface QuickBusinessEditorProps {
  bio: {
    id: string;
    slug: string;
    display_name: string;
    description: string | null;
    whatsapp: string | null;
    whatsapp_message: string | null;
    instagram: string | null;
    pix_key: string | null;
    published: boolean;
  };
  publicUrl: string;
}

export function QuickBusinessEditor({ bio, publicUrl }: QuickBusinessEditorProps) {
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(bio.display_name || "");
  const [description, setDescription] = useState(bio.description || "");
  const [whatsapp, setWhatsapp] = useState(bio.whatsapp || "");
  const [whatsappMessage, setWhatsappMessage] = useState(
    bio.whatsapp_message || "Olá! Gostaria de mais informações."
  );
  const [instagram, setInstagram] = useState(bio.instagram || "");
  const [pixKey, setPixKey] = useState(bio.pix_key || "");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sincroniza se bio mudar
  useEffect(() => {
    setDisplayName(bio.display_name || "");
    setDescription(bio.description || "");
    setWhatsapp(bio.whatsapp || "");
    setWhatsappMessage(bio.whatsapp_message || "Olá! Gostaria de mais informações.");
    setInstagram(bio.instagram || "");
    setPixKey(bio.pix_key || "");
  }, [bio]);

  // Formata telefone/whatsapp
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
    setSaveSuccess(false);
  };

  const cleanWhatsappDigits = whatsapp.replace(/\D/g, "");
  const testWhatsappUrl = cleanWhatsappDigits.length >= 10
    ? `https://wa.me/55${cleanWhatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  // Cálculo de progresso do perfil
  const checks = [
    { label: "Nome do negócio", done: Boolean(displayName.trim()) },
    { label: "WhatsApp de atendimento", done: cleanWhatsappDigits.length >= 10 },
    { label: "Descrição / Slogan", done: Boolean(description.trim()) },
    { label: "Instagram do negócio", done: Boolean(instagram.trim()) },
    { label: "Chave Pix para pagamentos", done: Boolean(pixKey.trim()) },
  ];
  const completedCount = checks.filter((c) => c.done).length;
  const progressPercent = Math.round((completedCount / checks.length) * 100);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cleanInsta = instagram
        .trim()
        .replace(/^@/, "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/[/?].*$/, "");

      const { error } = await supabase
        .from("bio_pages")
        .update({
          display_name: displayName.trim() || bio.display_name,
          description: description.trim() || null,
          whatsapp: cleanWhatsappDigits || null,
          whatsapp_message: whatsappMessage.trim() || null,
          instagram: cleanInsta ? `@${cleanInsta}` : null,
          pix_key: pixKey.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bio.id);

      if (error) throw error;

      setSaveSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ["bio-me"] });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.message || "Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.warn("Erro ao copiar link:", e);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-6 shadow-sm">
      {/* Topo do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/15 text-primary">
              <Store className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Configuração Rápida do Seu Negócio
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mude seu WhatsApp, redes e dados de atendimento com facilidade. Tudo atualiza na hora no seu site.
          </p>
        </div>

        {/* Barra de Completude */}
        <div className="bg-background/60 border border-border/80 rounded-xl p-3 sm:min-w-[200px] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Seu site está:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{progressPercent}% pronto</span>
          </div>
          <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Formulário Direto & Intuitivo */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome da Empresa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-primary" /> Nome do Seu Negócio
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSaveSuccess(false);
              }}
              placeholder="Ex: Pizzaria Bella, Dra. Amanda Odontologia"
              className="w-full rounded-lg border border-border bg-background/80 px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              required
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp Oficial (DDD + Número)
              </label>
              {testWhatsappUrl && (
                <a
                  href={testWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Testar link <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
            <input
              type="text"
              value={whatsapp}
              onChange={handleWhatsappChange}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-border bg-background/80 px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
            />
          </div>

          {/* Slogan / Descrição Curta */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Slogan ou Resumo dos Serviços
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSaveSuccess(false);
              }}
              placeholder="Ex: Especialistas em massas artesanais e rodízio em São Paulo. Entregas e reservas."
              className="w-full rounded-lg border border-border bg-background/80 px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Instagram className="h-3.5 w-3.5 text-pink-400" /> Perfil no Instagram (@)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                @
              </span>
              <input
                type="text"
                value={instagram.replace(/^@/, "")}
                onChange={(e) => {
                  setInstagram(e.target.value);
                  setSaveSuccess(false);
                }}
                placeholder="suaempresa"
                className="w-full rounded-lg border border-border bg-background/80 pl-8 pr-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Chave Pix */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-cyan-400" /> Chave Pix (Para receber pagamentos direto na página)
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => {
                setPixKey(e.target.value);
                setSaveSuccess(false);
              }}
              placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
              className="w-full rounded-lg border border-border bg-background/80 px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Alertas de Status */}
        {saveError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Barra de Ações: Salvar e Links do Site */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Caixa de Compartilhamento */}
          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Link do seu site:</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-white hover:text-primary transition-colors truncate max-w-[200px]"
            >
              {publicUrl.replace(/^https?:\/\//, "")}
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-white transition-colors ml-1"
              title="Copiar link do site"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/builder"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border/80 bg-transparent text-xs font-medium text-muted-foreground hover:text-white hover:border-primary/50 transition-all"
            >
              <Sliders className="h-3.5 w-3.5" /> Construtor Visual Avançado
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Salvo com Sucesso!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
