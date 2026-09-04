import { useState, useEffect } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Loader2,
  ExternalLink,
  Sparkles,
  Mail,
} from "lucide-react";
import { PageService } from "@/modules/page/services/PageService";

export interface TransferPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: {
    id: string;
    displayName: string;
    slug: string;
    phone?: string | null;
    email?: string | null;
    isDemo?: boolean;
  };
  onSuccess?: () => void;
}

export function TransferPageModal({ isOpen, onClose, page, onSuccess }: TransferPageModalProps) {
  const [activeTab, setActiveTab] = useState<"claim" | "email">("claim");

  // Estados do Link de Resgate
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Estados de Transferência por E-mail
  const [targetEmail, setTargetEmail] = useState(page.email || "");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    type: "success" | "error" | "not_found";
    message: string;
  } | null>(null);

  // Estado do botão "Tornar Oficial"
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialDone, setOfficialDone] = useState(!page.isDemo);

  // Gera o link de resgate ao abrir ou mudar de página
  useEffect(() => {
    if (isOpen && page.id) {
      void generateClaimLink();
    }
  }, [isOpen, page.id]);

  if (!isOpen) return null;

  async function generateClaimLink() {
    setClaimLoading(true);
    try {
      const res = await PageService.createClaimLink(page.id, targetEmail.trim() || undefined);
      setClaimUrl(res.claimUrl);
    } catch (err) {
      console.error("Erro ao gerar link de resgate:", err);
    } finally {
      setClaimLoading(false);
    }
  }

  const cleanPhone = page.phone ? page.phone.replace(/\D/g, "") : "";
  const whatsappTarget = cleanPhone
    ? cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`
    : "";

  const whatsappMessage = `Olá! Preparamos a presença digital oficial de *${page.displayName}* no EIA Link com fotos de alta conversão, vitrine de serviços e agendamento online.

Você pode conferir o resultado e assumir o controle do seu site acessando o link exclusivo abaixo:
👉 ${claimUrl || `https://eialink.com.br/p/${page.slug}`}

Ao acessar, você pode definir sua senha de acesso gratuita para gerenciar seus horários, preços e informações.`;

  function handleCopyLink() {
    if (!claimUrl) return;
    void navigator.clipboard.writeText(claimUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyMessage() {
    void navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  }

  function handleSendWhatsApp() {
    const url = whatsappTarget
      ? `https://wa.me/${whatsappTarget}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleMakeOfficial() {
    setOfficialLoading(true);
    try {
      await PageService.makePageOfficial(page.id);
      setOfficialDone(true);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao tornar oficial.";
      alert(msg);
    } finally {
      setOfficialLoading(false);
    }
  }

  async function handleTransferByEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = targetEmail.trim();
    if (!email) return;

    setTransferLoading(true);
    setTransferResult(null);

    try {
      const res = await PageService.transferOwnership(page.id, email);
      if (res.transferred) {
        setTransferResult({
          type: "success",
          message: `Página transferida com sucesso para ${res.targetUser?.name || "o cliente"} (${res.targetUser?.email})! O site já está disponível no painel dele.`,
        });
        setOfficialDone(true);
        onSuccess?.();
      } else {
        // Usuário não possui cadastro ainda
        setTransferResult({
          type: "not_found",
          message: `Nenhum usuário cadastrado com "${email}". Um link de resgate exclusivo foi preparado para ele criar a conta gratuita!`,
        });
        if (res.claimToken) {
          const origin = typeof window !== "undefined" ? window.location.origin : "https://eialink.com.br";
          setClaimUrl(`${origin}/resgatar?token=${res.claimToken}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao transferir página.";
      setTransferResult({ type: "error", message: msg });
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)]/15 text-[color:var(--primary)]">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground leading-tight">
                Entregar & Oficializar Página
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{page.displayName}</span> ·{" "}
                <a
                  href={`/p/${page.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-[color:var(--primary)] inline-flex items-center gap-0.5"
                >
                  eialink.com.br/p/{page.slug} <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex rounded-xl bg-surface p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("claim")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "claim"
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Link de Resgate no WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "email"
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            Transferir por E-mail
          </button>
        </div>

        {/* Aba 1: Link de Resgate no WhatsApp */}
        {activeTab === "claim" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/5 p-3 text-xs text-foreground/90 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-[color:var(--primary)]">
                <Sparkles className="h-4 w-4" /> A melhor estratégia para fechar clientes:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Envie a mensagem pronta no WhatsApp com o link de resgate exclusivo. O cliente acessa,
                vê o site profissional pronto e cria a senha dele em 10 segundos. A página é vinculada na hora à conta dele!
              </p>
            </div>

            {/* Link de Resgate */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Link Exclusivo de Resgate do Cliente
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={claimLoading ? "Gerando link seguro..." : claimUrl || ""}
                  className="input-field flex-1 font-mono text-xs bg-surface"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!claimUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-surface-elevated transition-colors"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Mensagem Formatada para WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mensagem Pronta para WhatsApp
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-xs text-[color:var(--primary)] hover:underline flex items-center gap-1"
                >
                  {copiedMessage ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedMessage ? "Mensagem copiada!" : "Copiar texto"}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {whatsappMessage}
              </div>
            </div>

            {/* Ações da Aba 1 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleMakeOfficial}
                disabled={officialLoading || officialDone}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  officialDone
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-surface hover:bg-surface-elevated text-foreground"
                }`}
                title="Remove a tarja de demonstração da página pública"
              >
                {officialLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : officialDone ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                )}
                {officialDone ? "Página Oficializada" : "Tornar Oficial Sem Transferir"}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar no WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Aba 2: Transferir por E-mail do Cliente */}
        {activeTab === "email" && (
          <form onSubmit={handleTransferByEmail} className="space-y-4">
            <div className="rounded-xl border border-border bg-surface/50 p-3 text-xs text-muted-foreground leading-relaxed">
              Use esta opção se o cliente já criou uma conta no <strong>EIA Link</strong>. Digite o e-mail
              da conta dele para mover o site diretamente para o painel dele.
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                E-mail da Conta do Cliente
              </label>
              <input
                type="email"
                required
                placeholder="cliente@email.com"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="input-field mt-1.5 w-full text-xs"
              />
            </div>

            {transferResult && (
              <div
                className={`rounded-xl p-3 text-xs border ${
                  transferResult.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : transferResult.type === "not_found"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                }`}
              >
                <p className="font-semibold">{transferResult.message}</p>
                {transferResult.type === "not_found" && claimUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("claim")}
                    className="mt-2 text-xs font-bold underline flex items-center gap-1 hover:opacity-80"
                  >
                    Ver e copiar o Link de Resgate gerado &rarr;
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={transferLoading || !targetEmail.trim()}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                {transferLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                {transferLoading ? "Verificando..." : "Transferir Propriedade"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

