import React, { useRef, useEffect, useState } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Eye,
  Pencil,
  Save,
  Image as ImageIcon,
  CheckCircle2,
  Undo2,
  X,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { DesignStyleModal } from "@/modules/studiopro/editor/DesignStyleModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface CreativeCanvasProps {
  desktopChatOpen?: boolean;
  onToggleDesktopChat?: () => void;
}

export function CreativeCanvas({ desktopChatOpen, onToggleDesktopChat }: CreativeCanvasProps = {}) {
  const {
    getActiveProject,
    previewDevice,
    setPreviewDevice,
    updateActiveProjectHtml,
  } = useCreativeStudioStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeProject = getActiveProject();
  const html = activeProject?.html || "";

  const [isVisualEditing, setIsVisualEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estado para troca de imagem
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [currentImgSrc, setCurrentImgSrc] = useState<string>("");
  const [newImgUrl, setNewImgUrl] = useState<string>("");

  // Renderiza o HTML no iframe quando ele muda ou carrega página do slug se for existente
  useEffect(() => {
    if (!iframeRef.current) return;

    if (html && html.trim().length > 30) {
      if (iframeRef.current.getAttribute("src")) {
        iframeRef.current.removeAttribute("src");
      }
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        // Se o modo de edição estiver ligado, reativa
        if (isVisualEditing) {
          enableVisualEditingInDoc(doc);
        }
      }
    } else if (activeProject?.slug) {
      // Carrega diretamente a página existente do lead na plataforma
      const targetUrl = `/p/${activeProject.slug}`;
      if (iframeRef.current.getAttribute("src") !== targetUrl) {
        iframeRef.current.src = targetUrl;
      }
    } else {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(
          `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#09090b;color:#71717a;font-family:sans-serif;font-size:14px;">Aguardando geração do site...</body></html>`,
        );
        doc.close();
      }
    }
  }, [html, activeProject?.slug]);

  // Ativa/desativa edição visual no documento do iframe
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    if (isVisualEditing) {
      enableVisualEditingInDoc(doc);
      toast.info("Modo de Edição Visual ativado! Clique em qualquer texto para editar ou em fotos para trocar.");
    } else {
      disableVisualEditingInDoc(doc);
    }
  }, [isVisualEditing]);

  /**
   * Remove marcações de edição visual antes de persistir o HTML limpo
   */
  function getCleanHtml(doc: Document): string {
    const clone = doc.cloneNode(true) as Document;

    // Remove estilos injetados de edição
    const styleEl = clone.getElementById("eialink-visual-editor-styles");
    if (styleEl) styleEl.remove();

    // Remove contentEditable e data-inline-editable
    clone.querySelectorAll("[data-inline-editable]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-inline-editable");
    });

    // Remove data-img-index
    clone.querySelectorAll("img").forEach((el) => {
      el.removeAttribute("data-img-index");
    });

    return "<!DOCTYPE html>\n" + clone.documentElement.outerHTML;
  }

  function saveCurrentIframeDom() {
    if (!iframeRef.current?.contentDocument) return;
    const clean = getCleanHtml(iframeRef.current.contentDocument);
    updateActiveProjectHtml(clean);
    setHasUnsavedChanges(false);
    toast.success("Alterações visuais salvas com sucesso!");
  }

  function enableVisualEditingInDoc(doc: Document) {
    // 1. Injeta estilo visual
    let styleEl = doc.getElementById("eialink-visual-editor-styles");
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "eialink-visual-editor-styles";
      styleEl.textContent = `
        [data-inline-editable="true"]:hover {
          outline: 2px dashed #10b981 !important;
          outline-offset: 3px !important;
          cursor: text !important;
          background: rgba(16, 185, 129, 0.08) !important;
          border-radius: 4px !important;
        }
        [data-inline-editable="true"]:focus {
          outline: 2px solid #10b981 !important;
          outline-offset: 3px !important;
          background: rgba(16, 185, 129, 0.15) !important;
          border-radius: 4px !important;
        }
        img[data-img-index]:hover {
          outline: 3px dashed #ec4899 !important;
          outline-offset: 3px !important;
          cursor: pointer !important;
          filter: brightness(1.1) !important;
          border-radius: 8px !important;
        }
      `;
      doc.head.appendChild(styleEl);
    }

    // 2. Torna textos editáveis
    const textSelectors = "h1, h2, h3, h4, h5, h6, p, span, a, button, li, b, strong, em, small, label";
    doc.querySelectorAll(textSelectors).forEach((el) => {
      // Ignora elementos vazios ou scripts
      if (el.tagName.toLowerCase() === "script" || el.tagName.toLowerCase() === "style") return;

      el.setAttribute("data-inline-editable", "true");
      (el as HTMLElement).contentEditable = "true";

      // Previne navegação ao clicar no modo de edição
      el.addEventListener("click", (e) => {
        if (el.tagName.toLowerCase() === "a" || el.tagName.toLowerCase() === "button") {
          e.preventDefault();
        }
      });

      // Ao perder o foco, marca alteração
      el.addEventListener("blur", () => {
        setHasUnsavedChanges(true);
      });
    });

    // 3. Mapeia imagens com clique para troca
    doc.querySelectorAll("img").forEach((img, idx) => {
      img.setAttribute("data-img-index", String(idx));
      img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedImgIndex(idx);
        setCurrentImgSrc(img.src);
        setNewImgUrl(img.src);
        setImageModalOpen(true);
      };
    });
  }

  function disableVisualEditingInDoc(doc: Document) {
    const styleEl = doc.getElementById("eialink-visual-editor-styles");
    if (styleEl) styleEl.remove();

    doc.querySelectorAll("[data-inline-editable]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-inline-editable");
    });

    doc.querySelectorAll("img").forEach((img) => {
      img.removeAttribute("data-img-index");
      img.onclick = null;
    });

    if (hasUnsavedChanges) {
      saveCurrentIframeDom();
    }
  }

  function handleApplyNewImage() {
    if (!iframeRef.current?.contentDocument || selectedImgIndex === null || !newImgUrl) return;
    const doc = iframeRef.current.contentDocument;
    const imgEl = doc.querySelectorAll("img")[selectedImgIndex];
    if (imgEl) {
      imgEl.src = newImgUrl;
      setHasUnsavedChanges(true);
      saveCurrentIframeDom();
      setImageModalOpen(false);
      toast.success("Imagem substituída com sucesso!");
    }
  }

  function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setNewImgUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  const deviceWidths = {
    desktop: "w-full",
    tablet: "max-w-[768px]",
    mobile: "max-w-[390px]",
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08070b] overflow-hidden relative">
      {/* Barra de Ferramentas Superior do Canvas */}
      <div className="h-12 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        {/* Controles da Esquerda: Recolher Chat e Seletores de Dispositivo */}
        <div className="flex items-center gap-2">
          {onToggleDesktopChat && (
            <button
              type="button"
              onClick={onToggleDesktopChat}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] text-xs transition-colors"
              title={desktopChatOpen ? "Recolher Copiloto IA" : "Abrir Copiloto IA"}
            >
              {desktopChatOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              <span className="text-[11px] font-medium hidden lg:inline">
                {desktopChatOpen ? "Recolher Chat" : "Abrir Chat"}
              </span>
            </button>
          )}

          {/* Seletores de Dispositivo */}
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                previewDevice === "desktop"
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Desktop"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setPreviewDevice("tablet")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                previewDevice === "tablet"
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tablet"
            >
              <Tablet size={14} />
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                previewDevice === "mobile"
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Celular"
            >
              <Smartphone size={14} />
            </button>
          </div>
        </div>

        {/* Alternador de Modo: Visualização vs Editor Visual (Point & Click) */}
        <div className="flex items-center gap-2">
          {html && (
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsVisualEditing(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  !isVisualEditing
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Modo de Navegação e Interação Normal"
              >
                <Eye size={13} />
                <span>Navegar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVisualEditing(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isVisualEditing
                    ? "bg-emerald-500 text-black shadow-md font-bold"
                    : "text-zinc-400 hover:text-emerald-400"
                }`}
                title="Clique em qualquer texto para editar ou em fotos para trocar"
              >
                <Pencil size={13} />
                <span>Editar Visual</span>
              </button>
            </div>
          )}

          {html && (
            <button
              type="button"
              onClick={() => setDesignModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Personalizar Fontes, Cores, Efeitos e Fotos"
            >
              <Palette size={13} />
              <span className="hidden sm:inline">Design & Estilo</span>
            </button>
          )}

          {isVisualEditing && hasUnsavedChanges && (
            <button
              type="button"
              onClick={saveCurrentIframeDom}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-sm animate-pulse"
              title="Salvar alterações manuais no banco"
            >
              <Save size={13} />
              <span>Salvar</span>
            </button>
          )}

          {html && (
            <button
              onClick={() => {
                const blob = new Blob([html], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors border border-white/[0.06]"
              title="Abrir em Nova Aba"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Aba Cheia</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarja Informativa quando o Editor Visual está ativo */}
      {isVisualEditing && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              <strong>Modo Point & Click Ativo:</strong> Clique diretamente nos textos para alterá-los ou nas fotos para trocar a imagem.
            </span>
          </div>
          <button
            onClick={() => setIsVisualEditing(false)}
            className="text-[11px] font-bold text-zinc-400 hover:text-white underline cursor-pointer"
          >
            Concluir Edição
          </button>
        </div>
      )}

      {/* Área do Iframe */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden relative">
        <div
          className={`h-full ${deviceWidths[previewDevice]} transition-all duration-300 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-zinc-950 flex flex-col`}
        >
          <iframe
            ref={iframeRef}
            title="Prévia do Estúdio Criativo"
            className="w-full h-full border-none bg-zinc-950"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>

      {/* Modal de Substituição Rápida de Imagem */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <ImageIcon className="h-4 w-4 text-pink-400" />
              Substituir Imagem Selecionada
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Escolha uma nova foto para esta posição da página.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Pré-visualização da imagem atual vs nova */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/10">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                <img
                  src={newImgUrl || currentImgSrc}
                  alt="Prévia"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-zinc-300 block">
                  Foto em Destaque
                </span>
                <span className="text-[10px] text-zinc-500 break-all line-clamp-2">
                  {newImgUrl || currentImgSrc}
                </span>
              </div>
            </div>

            {/* Opção 1: Upload do Computador */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                1. Subir Foto do seu Computador
              </label>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/50 cursor-pointer text-xs text-zinc-300 transition-colors">
                <Upload className="h-4 w-4 text-emerald-400" />
                <span>Escolher arquivo de imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Opção 2: URL Direta */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                2. Ou colar Link / URL da Imagem
              </label>
              <input
                type="text"
                value={newImgUrl}
                onChange={(e) => setNewImgUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full h-9 rounded-xl bg-zinc-900 border border-white/10 px-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyNewImage}
                disabled={!newImgUrl}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all disabled:opacity-40"
              >
                Aplicar Foto na Página
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Design & Estilo Visual No-Code */}
      <DesignStyleModal
        open={designModalOpen}
        onOpenChange={setDesignModalOpen}
      />
    </div>
  );
}
