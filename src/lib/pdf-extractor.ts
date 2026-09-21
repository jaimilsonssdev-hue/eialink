import * as pdfjsLib from "pdfjs-dist";

// Configura o worker do PDF.js para navegadores modernos
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfAssets {
  logoFile?: File;
  logoPreview?: string;
  coverFile?: File;
  coverPreview?: string;
  extractedText?: string;
  pageImages: Array<{
    file: File;
    previewUrl: string;
    pageNumber: number;
  }>;
}

/**
 * Converte um Canvas HTML em um File com nome especificado
 */
function canvasToFile(canvas: HTMLCanvasElement, filename: string, mimeType = "image/png"): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Falha ao gerar imagem a partir do canvas"));
        return;
      }
      const file = new File([blob], filename, { type: mimeType });
      resolve(file);
    }, mimeType, 0.92);
  });
}

/**
 * Processa um arquivo PDF diretamente no navegador:
 * 1. Extrai o texto semântico completo de todas as páginas (cardápios, preços, descrições, telefones).
 * 2. Renderiza a primeira página em alta resolução (2x scale).
 * 3. Recorta o topo da página 1 onde se localiza o logotipo e cabeçalho.
 * 4. Renderiza as páginas subsequentes como fotos nítidas para o catálogo de pratos/produtos.
 */
export async function extractAssetsFromPdf(pdfFile: File): Promise<ExtractedPdfAssets> {
  if (typeof window === "undefined") {
    return { pageImages: [] };
  }

  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const maxPagesToProcess = Math.min(totalPages, 5);

  const result: ExtractedPdfAssets = {
    pageImages: [],
    extractedText: "",
  };

  // 1. Extração Completa de Texto de Cada Página do PDF
  let accumulatedText = "";
  for (let p = 1; p <= maxPagesToProcess; p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || "")
        .filter((str: string) => str.trim().length > 0);

      const pageText = pageStrings.join(" ").replace(/\s{2,}/g, " ").trim();
      if (pageText) {
        accumulatedText += `[PÁGINA ${p} DO DOCUMENTO]:\n${pageText}\n\n`;
      }
    } catch (textErr) {
      console.warn(`Aviso ao extrair texto da página ${p} do PDF:`, textErr);
    }
  }
  result.extractedText = accumulatedText.trim();

  // 2. Renderiza Página 1 (Capa e Logotipo) em Alta Resolução (Scale 2.0x)
  try {
    const page1 = await pdfDoc.getPage(1);
    const viewport = page1.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderContext: any = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page1.render(renderContext).promise;

      // Imagem da Capa (Página 1 Completa em Alta Resolução)
      const coverFileName = `${pdfFile.name.replace(/\.[^.]+$/, "")}-capa.png`;
      const coverFile = await canvasToFile(canvas, coverFileName, "image/png");
      result.coverFile = coverFile;
      result.coverPreview = URL.createObjectURL(coverFile);

      // Recorte Focado do Logotipo (Topo 25% com margem de segurança)
      try {
        const logoCanvas = document.createElement("canvas");
        const logoCtx = logoCanvas.getContext("2d");

        if (logoCtx) {
          const cropHeight = Math.round(canvas.height * 0.25);
          const cropWidth = canvas.width;

          logoCanvas.width = cropWidth;
          logoCanvas.height = cropHeight;

          logoCtx.drawImage(
            canvas,
            0,
            0,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          const logoFileName = `${pdfFile.name.replace(/\.[^.]+$/, "")}-logo.png`;
          const logoFile = await canvasToFile(logoCanvas, logoFileName, "image/png");
          result.logoFile = logoFile;
          result.logoPreview = URL.createObjectURL(logoFile);
        }
      } catch (cropErr) {
        console.warn("Não foi possível recortar o topo do PDF para logotipo:", cropErr);
      }

      result.pageImages.push({
        file: coverFile,
        previewUrl: result.coverPreview,
        pageNumber: 1,
      });
    }
  } catch (p1Err) {
    console.warn("Erro ao renderizar primeira página do PDF:", p1Err);
  }

  // 3. Renderiza páginas subsequentes (pratos, serviços, cardápios)
  for (let p = 2; p <= Math.min(totalPages, 4); p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const pageViewport = page.getViewport({ scale: 1.6 });
      const pCanvas = document.createElement("canvas");
      const pCtx = pCanvas.getContext("2d");

      if (pCtx) {
        pCanvas.width = pageViewport.width;
        pCanvas.height = pageViewport.height;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pRenderContext: any = {
          canvasContext: pCtx,
          viewport: pageViewport,
        };

        await page.render(pRenderContext).promise;
        const pFileName = `${pdfFile.name.replace(/\.[^.]+$/, "")}-pagina-${p}.png`;
        const pFile = await canvasToFile(pCanvas, pFileName, "image/png");
        result.pageImages.push({
          file: pFile,
          previewUrl: URL.createObjectURL(pFile),
          pageNumber: p,
        });
      }
    } catch (pageErr) {
      console.warn(`Aviso ao renderizar página ${p} do PDF:`, pageErr);
    }
  }

  return result;
}
