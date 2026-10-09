import React, { useState, useEffect } from "react";
import { Printer, QrCode, Sparkles, X, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LoyaltyPointToken } from "@/modules/loyalty";

export interface ThermalReceiptPrintProps {
  token: LoyaltyPointToken;
  claimUrl: string;
  qrCodeUrl: string;
  onClose?: () => void;
}

export function ThermalReceiptPrint({
  token,
  claimUrl,
  qrCodeUrl,
  onClose,
}: ThermalReceiptPrintProps) {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("thermal_paper_width") as "58mm" | "80mm") || "58mm";
    }
    return "58mm";
  });

  const [autoPrint, setAutoPrint] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("thermal_auto_print") === "true";
    }
    return false;
  });

  const handlePrint = () => {
    window.print();
  };

  // Se auto-impressão estiver ativada, aciona window.print() logo após a renderização do QR Code
  useEffect(() => {
    if (autoPrint && qrCodeUrl) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, qrCodeUrl]);

  const handleSetWidth = (w: "58mm" | "80mm") => {
    setPaperWidth(w);
    if (typeof window !== "undefined") {
      localStorage.setItem("thermal_paper_width", w);
    }
  };

  const handleToggleAutoPrint = (val: boolean) => {
    setAutoPrint(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("thermal_auto_print", String(val));
    }
  };

  const formattedDate = new Date(token.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="thermal-receipt-modal flex flex-col items-center">
      {/* Barra de Controles e Configurações (Ocultos na impressão física) */}
      <div className="no-print flex flex-col gap-3 w-full pb-4 border-b border-zinc-800 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Cupom de Pontos (Térmica {paperWidth})</h4>
              <p className="text-xs text-zinc-400">Grampeie na embalagem do delivery ou entregue no balcão</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Chamar Impressora
            </Button>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-zinc-800 text-zinc-400 hover:text-zinc-100 h-9"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Configurações de Impressão Rápida */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Largura da Bobina:</span>
            <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => handleSetWidth("58mm")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  paperWidth === "58mm"
                    ? "bg-emerald-500 text-black shadow-xs font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                58mm (Máquininha / iFood)
              </button>
              <button
                type="button"
                onClick={() => handleSetWidth("80mm")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  paperWidth === "80mm"
                    ? "bg-emerald-500 text-black shadow-xs font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                80mm (Bematech / Epson)
              </button>
            </div>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => handleToggleAutoPrint(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
            />
            <span className="text-[11px]">Chamar impressora automaticamente</span>
          </label>
        </div>
      </div>

      {/* ÁREA DO CUPOM TÉRMICO (Formatada para impressoras 58mm/80mm) */}
      <div
        id="thermal-receipt-print-area"
        className={`thermal-receipt-sheet bg-white text-black p-4 rounded-md shadow-2xl font-mono text-center border border-zinc-300 select-all ${
          paperWidth === "58mm" ? "w-[240px]" : "w-[300px]"
        }`}
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          lineHeight: "1.2",
        }}
      >
        <div className="border-b-2 border-dashed border-black pb-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider">{token.businessName}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">CLUBE DE FIDELIDADE & PONTOS</p>
          <p className="text-[9px] text-zinc-500 mt-0.5">{formattedDate}</p>
        </div>

        <div className="my-2">
          <p className="text-[11px] font-bold">PARABÉNS PELA COMPRA!</p>
          {token.purchaseAmount && (
            <p className="text-[10px] text-zinc-600">
              Valor do Pedido: R$ {token.purchaseAmount.toFixed(2).replace(".", ",")}
            </p>
          )}
          <div className="my-2 py-1.5 bg-zinc-100 border border-black/20 rounded">
            <span className="text-[9px] block font-bold text-zinc-700 uppercase">Você Acumulou:</span>
            <span className="text-2xl font-black tracking-tight text-black">
              +{token.points} PONTOS
            </span>
          </div>
        </div>

        {/* QR Code de Alta Resolução P&B */}
        <div className="my-2 flex flex-col items-center justify-center">
          <div className="bg-white p-1.5 border-2 border-black inline-block rounded">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code de Pontos"
                className={paperWidth === "58mm" ? "w-36 h-36 object-contain mx-auto block" : "w-44 h-44 object-contain mx-auto block"}
                loading="eager"
              />
            ) : (
              <div className="w-36 h-36 bg-zinc-100 animate-pulse flex items-center justify-center text-[10px] text-zinc-500">
                Gerando QR Code...
              </div>
            )}
          </div>
          <p className="text-[10px] font-bold mt-1.5 uppercase tracking-wide">
            Aponte a câmera do celular
          </p>
          <p className="text-[8px] text-zinc-700">
            Escaneie para creditar seus pontos no site
          </p>
        </div>

        <div className="border-t-2 border-dashed border-black pt-2 mt-2 text-[8px] text-zinc-600 space-y-0.5">
          <p className="font-bold">* CÓDIGO DE USO ÚNICO *</p>
          <p>Expira em 7 dias após a emissão.</p>
          <p className="truncate text-[7px] text-zinc-500">Token: {token.tokenId}</p>
        </div>
      </div>

      {/* Estilos CSS dedicados para envio à impressora física via window.print() */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-print-area, #thermal-receipt-print-area * {
            visibility: visible !important;
          }
          #thermal-receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperWidth === "58mm" ? "54mm" : "78mm"} !important;
            max-width: ${paperWidth === "58mm" ? "58mm" : "80mm"} !important;
            padding: 2mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
