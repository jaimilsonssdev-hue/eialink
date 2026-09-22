import { useState } from "react";
import { Copy, Check, ExternalLink, Sparkles, MessageCircle, CreditCard, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function WhatsAppCheckoutLinksCard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://eialink.com.br";
  };

  const origin = getBaseUrl();

  const links = [
    {
      key: "pro_yearly",
      title: "Plano Pro Anual (Cartão de Crédito)",
      badge: "Mais Vendido · 2 Meses Grátis",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      price: "R$ 290/ano (R$ 24,16/mês)",
      url: `${origin}/assinar?plan=pro-yearly`,
      icon: Sparkles,
      iconColor: "text-emerald-400",
    },
    {
      key: "pro_yearly_pix",
      title: "Plano Pro Anual (Pix à Vista)",
      badge: "Pix · Sem Cartão",
      badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
      price: "R$ 290 à vista no Pix",
      url: `${origin}/assinar?plan=pro-yearly-pix`,
      icon: QrCode,
      iconColor: "text-violet-400",
    },
    {
      key: "pro_monthly",
      title: "Plano Pro Mensal (Cartão de Crédito)",
      badge: "Sem Fidelidade",
      badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
      price: "R$ 29/mês",
      url: `${origin}/assinar?plan=pro-monthly`,
      icon: CreditCard,
      iconColor: "text-fuchsia-400",
    },
  ];

  function copyToClipboard(text: string, key: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copiado para a área de transferência!`);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  function getWhatsAppScript(planType: "yearly" | "monthly") {
    if (planType === "yearly") {
      return `Olá! Conforme combinamos, aqui está seu link direto e seguro para ativação da sua Máquina EIA Link Pro com condição especial anual (2 meses grátis):

👉 ${origin}/assinar?plan=pro-yearly

⭐ O que está liberado de imediato:
✅ Vitrine estilo Instagram com pedidos no seu WhatsApp
✅ Agendamento Online 24/7 integrado ao Google Agenda
✅ Aplicativo PWA no celular do seu cliente
✅ QR Codes dinâmicos de balcão para imprimir
✅ 100% com a sua marca e 0% de comissão

Assim que concluir, o sistema libera seu painel na hora para começarmos a configurar seu negócio!`;
    }

    return `Olá! Conforme combinamos, aqui está seu link seguro para ativação da sua Máquina EIA Link Pro no plano mensal (sem fidelidade, cancele quando quiser):

👉 ${origin}/assinar?plan=pro-monthly

⭐ O que está liberado de imediato:
✅ Vitrine estilo Instagram com pedidos no seu WhatsApp
✅ Agendamento Online 24/7 integrado ao Google Agenda
✅ Aplicativo PWA no celular do seu cliente
✅ QR Codes dinâmicos de balcão para imprimir
✅ 100% com a sua marca e 0% de comissão

Assim que concluir, o sistema libera seu painel na hora para começarmos a configurar seu negócio!`;
  }

  return (
    <Card className="border-fuchsia-500/30 bg-gradient-to-b from-[#160d26] to-[#0c0817] shadow-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Links Diretos de Checkout para WhatsApp
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Envie direto para o cliente fechar a venda sem precisar navegar pelo site institucional.
              </CardDescription>
            </div>
          </div>
          <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-bold text-fuchsia-300">
            ⚡ Fechamento Rápido
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Lista de Links Diretos */}
        <div className="grid gap-3 md:grid-cols-3">
          {links.map((item) => {
            const Icon = item.icon;
            const isCopied = copiedKey === item.key;
            return (
              <div
                key={item.key}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-zinc-300 font-semibold mt-1">{item.price}</p>
                  <p className="text-[11px] font-mono text-zinc-500 truncate mt-2 bg-black/40 p-1.5 rounded border border-white/5">
                    {item.url}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.url, item.key, item.title)}
                    className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 py-2 px-3 text-xs font-bold text-white transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copiar Link
                      </>
                    )}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 p-2 text-zinc-400 hover:text-white transition-all"
                    title="Testar Link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scripts de Mensagem Pronta para WhatsApp */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            Scripts de Fechamento Prontos para Copiar e Colar
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  getWhatsAppScript("yearly"),
                  "script_yearly",
                  "Mensagem do Plano Anual",
                )
              }
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-all"
            >
              {copiedKey === "script_yearly" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Mensagem Copiada!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar Mensagem Pronta (Anual R$ 290)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  getWhatsAppScript("monthly"),
                  "script_monthly",
                  "Mensagem do Plano Mensal",
                )
              }
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-3.5 py-2 text-xs font-bold text-fuchsia-300 transition-all"
            >
              {copiedKey === "script_monthly" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Mensagem Copiada!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar Mensagem Pronta (Mensal R$ 29)
                </>
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

