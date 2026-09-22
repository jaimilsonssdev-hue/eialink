import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  Star,
  Radio,
  Sparkles,
  QrCode,
  Smartphone,
  ExternalLink,
  Instagram,
  CreditCard,
  Utensils,
  Check,
} from "lucide-react";
import { DynamicLinkService } from "@/modules/nfc/services/DynamicLinkService";
import type { DynamicLink, PlaqueSize, PlaqueColorTheme } from "@/modules/nfc/types";

interface PlaquePrintModalProps {
  link: DynamicLink | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaquePrintModal({ link, isOpen, onClose }: PlaquePrintModalProps) {
  const [size, setSize] = useState<PlaqueSize>("10x15");
  const [theme, setTheme] = useState<PlaqueColorTheme>("google_clean");
  const [isExporting, setIsExporting] = useState(false);
  const plaqueCardRef = useRef<HTMLDivElement>(null);

  if (!link) return null;

  const shortUrl = DynamicLinkService.getShortUrl(link.code);
  const qrCodeUrl = DynamicLinkService.getQrCodeUrl(shortUrl, 600);

  // Inicializa tema padrão baseado no tipo
  const activeTheme =
    link.type === "pix"
      ? "pix_emerald"
      : link.type === "instagram"
      ? "instagram_vibe"
      : theme;

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPng() {
    setIsExporting(true);
    try {
      // Cria um canvas em altíssima definição (1200x1800 para 10x15cm em alta resolução)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = size === "10x15" ? 1200 : 840;
      const height = size === "10x15" ? 1800 : 1200;
      canvas.width = width;
      canvas.height = height;

      // 1. Fundo baseado no tema
      if (activeTheme === "luxury_black") {
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, width, height);

        // Borda dourada sutil
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 12;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      } else if (activeTheme === "pix_emerald") {
        ctx.fillStyle = "#022c22";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 12;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      } else if (activeTheme === "instagram_vibe") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#833ab4");
        grad.addColorStop(0.5, "#fd1d1d");
        grad.addColorStop(1, "#fcb045");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(30, 30, width - 60, height - 60);
      } else {
        // google_clean
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 8;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      }

      // 2. Títulos e Textos
      ctx.textAlign = "center";

      // Nome da empresa
      ctx.font = `bold ${width * 0.045}px sans-serif`;
      ctx.fillStyle = activeTheme === "google_clean" ? "#0f172a" : "#ffffff";
      ctx.fillText(link.company_name.toUpperCase(), width / 2, height * 0.12);

      // Chamada Principal
      let mainTitle = "AVALIE-NOS NO GOOGLE";
      let subTitle = "Sua avaliação de 5 estrelas é muito importante para nós!";
      if (link.type === "pix") {
        mainTitle = "PAGUE COM PIX";
        subTitle = link.pix_receiver_name || "Aproxime ou aponte a câmera";
      } else if (link.type === "instagram") {
        mainTitle = "SIGA NOSSO INSTAGRAM";
        subTitle = link.instagram_username ? `@${link.instagram_username.replace("@", "")}` : "Acompanhe novidades diárias";
      } else if (link.type === "menu_comanda") {
        mainTitle = "CARDÁPIO & COMANDA";
        subTitle = "Faça seu pedido diretamente pelo celular";
      }

      ctx.font = `900 ${width * 0.065}px sans-serif`;
      if (activeTheme === "google_clean") {
        ctx.fillStyle = "#1e293b";
      } else if (activeTheme === "luxury_black") {
        ctx.fillStyle = "#fbbf24";
      } else {
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillText(mainTitle, width / 2, height * 0.2);

      // 5 Estrelas Douradas se for Google Review
      if (link.type === "google_review") {
        ctx.font = `bold ${width * 0.06}px sans-serif`;
        ctx.fillStyle = "#eab308";
        ctx.fillText("★ ★ ★ ★ ★", width / 2, height * 0.26);

        ctx.font = `${width * 0.03}px sans-serif`;
        ctx.fillStyle = activeTheme === "google_clean" ? "#64748b" : "#cbd5e1";
        ctx.fillText(subTitle, width / 2, height * 0.31);
      } else {
        ctx.font = `${width * 0.032}px sans-serif`;
        ctx.fillStyle = activeTheme === "google_clean" ? "#64748b" : "#cbd5e1";
        ctx.fillText(subTitle, width / 2, height * 0.26);
      }

      // 3. Carrega e Desenha a imagem do QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("Erro ao carregar QR Code"));
        qrImg.src = qrCodeUrl;
      });

      const qrBoxSize = width * 0.52;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = height * 0.36;

      // Fundo branco com bordas arredondadas para o QR Code
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrBoxX - 16, qrBoxY - 16, qrBoxSize + 32, qrBoxSize + 32, 24);
      ctx.fill();

      ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // 4. Rodapé e Instrução NFC
      ctx.font = `bold ${width * 0.038}px sans-serif`;
      ctx.fillStyle = activeTheme === "google_clean" ? "#0f172a" : "#ffffff";
      ctx.fillText("APROXIME SEU CELULAR AQUI", width / 2, height * 0.82);

      ctx.font = `${width * 0.028}px sans-serif`;
      ctx.fillStyle = activeTheme === "google_clean" ? "#64748b" : "#94a3b8";
      ctx.fillText("ou aponte a câmera para o QR Code", width / 2, height * 0.86);

      // Badge NFC
      ctx.font = `bold ${width * 0.024}px sans-serif`;
      ctx.fillStyle = activeTheme === "luxury_black" ? "#fbbf24" : activeTheme === "pix_emerald" ? "#34d399" : "#6366f1";
      ctx.fillText(`Tecnologia NFC • ${shortUrl.replace("https://", "")}`, width / 2, height * 0.93);

      // 5. Trigger download
      const pngData = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngData;
      downloadLink.download = `plaquinha-${size}-${link.code}.png`;
      downloadLink.click();
    } catch (err) {
      console.error("Erro ao gerar imagem de impressão da plaquinha:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border text-foreground p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-[11px] font-medium border-primary/30 text-primary bg-primary/10"
            >
              Impressão Gráfica & Acrílico
            </Badge>
            <span className="text-xs text-muted-foreground">
              Resolução Gráfica de 300 DPI
            </span>
          </div>
          <DialogTitle className="text-xl font-bold">
            Gerador Visual de Plaquinhas
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Visualize o modelo pronto para gravação em acrílico, imprima diretamente ou baixe o PNG em alta resolução.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Controles de Estilo */}
          <div className="md:col-span-5 space-y-4">
            {/* Tamanho da Plaquinha */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Formato Gráfico Padrão
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSize("10x15")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    size === "10x15"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="text-xs font-bold">10 x 15 cm</div>
                  <div className="text-[10px] text-muted-foreground">
                    Display Balcão (Mais Vendido)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSize("7x10")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    size === "7x10"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="text-xs font-bold">7 x 10 cm</div>
                  <div className="text-[10px] text-muted-foreground">
                    Compacto p/ Mesas
                  </div>
                </button>
              </div>
            </div>

            {/* Tema Visual */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Tema / Acabamento Visual
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("google_clean")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    activeTheme === "google_clean"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-white border border-slate-300 shadow-xs shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Clean Branco</div>
                    <div className="text-[10px] text-muted-foreground">Acrílico Cristal</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("luxury_black")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    activeTheme === "luxury_black"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-slate-900 border border-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Black & Gold</div>
                    <div className="text-[10px] text-muted-foreground">Black Piano Luxo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("pix_emerald")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    activeTheme === "pix_emerald"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Pix Oficial</div>
                    <div className="text-[10px] text-muted-foreground">Verde Esmeralda</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("instagram_vibe")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    activeTheme === "instagram_vibe"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Instagram</div>
                    <div className="text-[10px] text-muted-foreground">Gradiente Vibe</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Informações da Plaquinha */}
            <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-semibold text-foreground">{link.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de Produto:</span>
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                  {link.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug / Link Curto:</span>
                <span className="font-mono text-primary font-medium">{shortUrl}</span>
              </div>
            </div>

            {/* Ações de Download e Impressão */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-md"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Gerando PNG de Alta Resolução..." : "Baixar Imagem PNG (Gráfica)"}
              </Button>

              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full h-10 rounded-xl text-xs"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Direto (Impressora)
              </Button>
            </div>
          </div>

          {/* Coluna Direita: Mockup Visual da Plaquinha em Acrílico */}
          <div className="md:col-span-7 flex flex-col items-center justify-center p-4 bg-muted/20 rounded-2xl border border-dashed border-border">
            <div
              ref={plaqueCardRef}
              id="print-plaque-area"
              className={`relative shadow-2xl rounded-2xl border overflow-hidden flex flex-col items-center text-center p-6 transition-all duration-300 ${
                size === "10x15" ? "w-[270px] min-h-[400px]" : "w-[230px] min-h-[340px]"
              } ${
                activeTheme === "luxury_black"
                  ? "bg-slate-950 text-white border-amber-400/40 ring-1 ring-amber-400/20"
                  : activeTheme === "pix_emerald"
                  ? "bg-emerald-950 text-white border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : activeTheme === "instagram_vibe"
                  ? "bg-gradient-to-b from-purple-900 via-rose-950 to-slate-950 text-white border-rose-500/40"
                  : "bg-white text-slate-900 border-slate-200 shadow-xl"
              }`}
            >
              {/* Efeito Brilho Acrílico */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none" />

              {/* Nome da Empresa */}
              <p
                className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  activeTheme === "google_clean" ? "text-slate-500" : "text-slate-300"
                }`}
              >
                {link.company_name}
              </p>

              {/* Título e Estrelas ou Ícones */}
              {link.type === "google_review" && (
                <div className="space-y-1 mb-3">
                  <div className="inline-flex items-center justify-center gap-1">
                    <span className="text-blue-500 font-extrabold text-sm">G</span>
                    <span className="text-red-500 font-extrabold text-sm">o</span>
                    <span className="text-amber-500 font-extrabold text-sm">o</span>
                    <span className="text-blue-500 font-extrabold text-sm">g</span>
                    <span className="text-emerald-500 font-extrabold text-sm">l</span>
                    <span className="text-red-500 font-extrabold text-sm">e</span>
                  </div>
                  <h3 className="text-sm font-black tracking-tight leading-tight">
                    AVALIE-NOS NO GOOGLE
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-amber-400 py-1">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <Star className="h-4 w-4 fill-amber-400" />
                    <Star className="h-4 w-4 fill-amber-400" />
                    <Star className="h-4 w-4 fill-amber-400" />
                    <Star className="h-4 w-4 fill-amber-400" />
                  </div>
                  <p
                    className={`text-[9px] max-w-[200px] leading-tight ${
                      activeTheme === "google_clean" ? "text-slate-500" : "text-slate-300"
                    }`}
                  >
                    Sua opinião 5 estrelas é muito importante para nós!
                  </p>
                </div>
              )}

              {link.type === "pix" && (
                <div className="space-y-1 mb-3">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 mx-auto">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-emerald-400">
                    PAGUE COM PIX
                  </h3>
                  <p className="text-[10px] text-emerald-100 font-medium">
                    {link.pix_receiver_name || link.company_name}
                  </p>
                </div>
              )}

              {link.type === "instagram" && (
                <div className="space-y-1 mb-3">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 mx-auto">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-rose-300">
                    SIGA NOSSO INSTAGRAM
                  </h3>
                  <p className="text-[11px] font-bold text-rose-200">
                    {link.instagram_username ? `@${link.instagram_username.replace("@", "")}` : "@perfil"}
                  </p>
                </div>
              )}

              {link.type === "menu_comanda" && (
                <div className="space-y-1 mb-3">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary mx-auto">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight">
                    CARDÁPIO DIGITAL
                  </h3>
                  <p className="text-[9px] text-muted-foreground">
                    Acesse o menu e faça seu pedido
                  </p>
                </div>
              )}

              {/* QR Code Centralizado em Caixa Branca com cantos arredondados */}
              <div className="my-2 bg-white p-3 rounded-2xl shadow-md flex items-center justify-center border border-slate-100">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Plaquinha"
                  className="w-36 h-36 object-contain"
                />
              </div>

              {/* Chamada NFC de Aproximação */}
              <div className="mt-auto pt-2 space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span>Aproxime seu celular aqui</span>
                </div>
                <p
                  className={`text-[8px] ${
                    activeTheme === "google_clean" ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  ou aponte a câmera para o QR Code
                </p>
                <span className="text-[8px] font-mono text-muted-foreground block opacity-60">
                  {shortUrl.replace("https://", "")}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Prévia real de impressão em acrílico ({size === "10x15" ? "10 x 15 cm" : "7 x 10 cm"})
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

