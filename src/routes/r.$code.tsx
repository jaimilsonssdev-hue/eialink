import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  CreditCard,
  UserCheck,
  ExternalLink,
  Download,
} from "lucide-react";
import { DynamicLinkService } from "@/modules/nfc/services/DynamicLinkService";
import { ComandaService } from "@/modules/comanda/services/ComandaService";
import type { DynamicLink } from "@/modules/nfc/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/r/$code")({
  component: DynamicRedirectPage,
  head: () => ({ meta: [{ title: "Redirecionamento Inteligente — EIA Link" }] }),
});

function DynamicRedirectPage() {
  const { code } = Route.useParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Localizando destino...");
  const [pixData, setPixData] = useState<DynamicLink | null>(null);
  const [vcardData, setVcardData] = useState<DynamicLink | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (!code) {
      setErrorMsg("Código curto inválido.");
      return;
    }

    let isCancelled = false;

    async function resolveRoute() {
      try {
        // 1. Tenta resolver na Central de Links Dinâmicos / Plaquinhas NFC
        setLoadingText("Conectando à plaquinha...");
        const nfcRes = await DynamicLinkService.resolve(code);

        if (isCancelled) return;

        if (nfcRes?.found && nfcRes.link) {
          const link = nfcRes.link;

          // Se for Plaquinha Pix e possuir chave Pix cadastrada
          if (link.type === "pix" && link.pix_key) {
            setPixData(link);
            return;
          }

          // Se for Cartão de Visitas Inteligente vCard
          if (link.type === "vcard" && link.vcard_data) {
            setVcardData(link);
            // Inicia download automático do vCard
            DynamicLinkService.downloadVCard(
              link.vcard_data,
              `${link.company_name || "contato"}.vcf`,
            );
            return;
          }

          // Para todos os outros tipos (Google Review, Instagram, WhatsApp, Custom, etc.)
          if (link.target_url) {
            window.location.replace(link.target_url);
            return;
          }
        }

        // 2. Se não encontrou nas plaquinhas, tenta resolver na Comanda Digital (Mesas & Garçons)
        setLoadingText("Abrindo Cardápio Digital...");
        const comandaRes = await ComandaService.resolveDynamicCode(code);

        if (isCancelled) return;

        if (comandaRes?.targetUrl) {
          window.location.replace(comandaRes.targetUrl);
          return;
        }

        setErrorMsg("Plaquinha ou código não encontrado.");
      } catch (err) {
        if (isCancelled) return;
        console.error("Erro ao resolver destino dinâmico:", err);
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Não foi possível encontrar o destino configurado para este cartão ou plaquinha.",
        );
      }
    }

    resolveRoute();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  function handleCopyPixKey() {
    if (!pixData?.pix_key) return;
    navigator.clipboard.writeText(pixData.pix_key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  }

  // Tela dedicada de Pagamento Pix Balcão
  if (pixData) {
    const qrPixUrl = DynamicLinkService.getQrCodeUrl(pixData.pix_key || "", 300);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <Card className="w-full max-w-sm border-emerald-500/30 bg-slate-900 shadow-2xl rounded-3xl text-center overflow-hidden border">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs mb-2">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">{pixData.company_name || pixData.title}</h2>
            <p className="text-xs text-emerald-100 opacity-90 mt-1">
              Pagamento Rápido via Pix
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* QR Code */}
            <div className="mx-auto w-48 h-48 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center">
              <img
                src={qrPixUrl}
                alt="QR Code Pix"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Chave Pix e Copiar */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block text-center">
                Chave Pix Oficial
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 break-all select-all">
                <span className="flex-1">{pixData.pix_key}</span>
              </div>
            </div>

            <Button
              onClick={handleCopyPixKey}
              className={`w-full h-11 text-sm font-semibold rounded-xl transition-all shadow-md ${
                copiedPix
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {copiedPix ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Chave Copiada! Abra seu Banco
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Chave Pix
                </>
              )}
            </Button>

            {pixData.pix_receiver_name && (
              <p className="text-xs text-slate-400">
                Beneficiário:{" "}
                <strong className="text-slate-200">{pixData.pix_receiver_name}</strong>
                {pixData.pix_city && ` • ${pixData.pix_city}`}
              </p>
            )}

            {pixData.target_url && (
              <a
                href={pixData.target_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline pt-2"
              >
                <span>Acessar comprovante ou site da empresa</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de vCard (Cartão de Visitas Inteligente)
  if (vcardData && vcardData.vcard_data) {
    const vc = vcardData.vcard_data;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <Card className="w-full max-w-sm border-purple-500/30 bg-slate-900 shadow-2xl rounded-3xl text-center overflow-hidden border">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs mb-2">
              <UserCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold">{vc.fullName || vcardData.title}</h2>
            {vc.role && (
              <p className="text-xs text-purple-200 mt-0.5">{vc.role}</p>
            )}
            {vc.company && (
              <p className="text-xs text-purple-100 font-medium opacity-90">{vc.company}</p>
            )}
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="text-left space-y-2 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              {vc.phone && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Telefone</span>
                  <span className="font-semibold text-slate-200">{vc.phone}</span>
                </div>
              )}
              {vc.email && (
                <div>
                  <span className="text-slate-400 block text-[11px]">E-mail</span>
                  <span className="font-semibold text-slate-200">{vc.email}</span>
                </div>
              )}
              {vc.website && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Website</span>
                  <a
                    href={vc.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 underline font-semibold break-all"
                  >
                    {vc.website}
                  </a>
                </div>
              )}
            </div>

            <Button
              onClick={() =>
                DynamicLinkService.downloadVCard(
                  vc,
                  `${vc.fullName || "contato"}.vcf`,
                )
              }
              className="w-full h-11 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Salvar Contato no Celular (.vcf)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm border-border bg-card shadow-lg rounded-2xl text-center overflow-hidden">
        <CardContent className="p-8 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
            <QrCode className="h-7 w-7" />
          </div>

          {!errorMsg ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-foreground font-semibold text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{loadingText}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Conectando ao destino configurado. Aguarde um instante...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-rose-300 bg-rose-500/10 p-3 rounded-lg">
                {errorMsg}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.replace("/")}
                className="w-full text-xs"
              >
                Ir para o Início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
