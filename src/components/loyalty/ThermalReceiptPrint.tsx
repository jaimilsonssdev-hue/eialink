import React from "react";
import { Printer, QrCode, Sparkles, X } from "lucide-react";
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
  const handlePrint = () => {
    window.print();
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
      {/* Botões de Ação na Tela (Ocultos na impressão física via @media print) */}
      <div className="no-print flex items-center justify-between w-full pb-4 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100">Cupom de Pontos (Térmica 58/80mm)</h4>
            <p className="text-xs text-zinc-400">Pronto para imprimir e grampear na embalagem ou entregar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs h-9 gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Cupom
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

      {/* ÁREA DO CUPOM TÉRMICO (Formatada para impressoras 58mm/80mm) */}
      <div
        id="thermal-receipt-print-area"
        className="thermal-receipt-sheet bg-white text-black p-5 rounded-md shadow-2xl font-mono text-center w-[300px] border border-zinc-300 select-all"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          lineHeight: "1.25",
        }}
      >
        <div className="border-b-2 border-dashed border-black pb-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider">{token.businessName}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">CLUBE DE PONTOS VIP</p>
          <p className="text-[9px] text-zinc-500 mt-0.5">{formattedDate}</p>
        </div>

        <div className="my-3">
          <p className="text-[11px] font-bold">PARABÉNS PELA COMPRA!</p>
          {token.purchaseAmount && (
            <p className="text-[10px] text-zinc-600">
              Valor do Pedido: R$ {token.purchaseAmount.toFixed(2).replace(".", ",")}
            </p>
          )}
          <div className="my-2 py-1 bg-zinc-100 border border-black/20 rounded">
            <span className="text-[10px] block font-bold text-zinc-700">VOCÊ ACUMULOU:</span>
            <span className="text-2xl font-extrabold tracking-tight text-black">
              +{token.points} PONTOS
            </span>
          </div>
        </div>

        {/* QR Code de Alta Resolução P&B */}
        <div className="my-3 flex flex-col items-center justify-center">
          <div className="bg-white p-2 border-2 border-black inline-block rounded">
            <img
              src={qrCodeUrl}
              alt="QR Code de Pontos"
              className="w-40 h-40 object-contain mx-auto block"
              loading="eager"
            />
          </div>
          <p className="text-[10px] font-bold mt-2 uppercase tracking-wide">
            Aponte a câmera do celular
          </p>
          <p className="text-[9px] text-zinc-700">
            Escaneie para creditar seus pontos no site
          </p>
        </div>

        <div className="border-t-2 border-dashed border-black pt-2 mt-2 text-[8px] text-zinc-600 space-y-0.5">
          <p className="font-bold">* CÓDIGO DE USO ÚNICO *</p>
          <p>Expira em 7 dias após a emissão.</p>
          <p className="truncate text-[8px] text-zinc-500">Token: {token.tokenId}</p>
        </div>
      </div>

      {/* Estilos CSS dedicados para envio à impressora física via window.print() */}
      <style>{`
        @media print {
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
            width: 78mm !important;
            max-width: 80mm !important;
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
