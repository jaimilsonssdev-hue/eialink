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
 * 1. Renderiza a primeira página em alta resolução (2x scale).
 * 2. Recorta o topo da página 1 onde se localiza o cabeçalho e logotipo do estabelecimento.
 * 3. Renderiza a página completa como banner de capa.
 * 4. Renderiza até 3 páginas do PDF como imagens de produtos/catálogo.
 */
export async function extractAssetsFromPdf(pdfFile: File): Promise<ExtractedPdfAssets> {
  if (typeof window === "undefined") {
    return { pageImages: [] };
  }

  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  const numPages = Math.min(pdfDoc.numPages, 3);
  const result: ExtractedPdfAssets = {
    pageImages: [],
  };

  // Renderiza Página 1 (Capa e Logotipo)
  const page1 = await pdfDoc.getPage(1);
  const viewport = page1.getViewport({ scale: 1.8 });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Contexto 2D do Canvas indisponível");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderContext: any = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page1.render(renderContext).promise;

  // 1. Gera a imagem da Capa (Página 1 Completa)
  const coverFileName = `${pdfFile.name.replace(/\.[^.]+$/, "")}-capa.png`;
  const coverFile = await canvasToFile(canvas, coverFileName, "image/png");
  result.coverFile = coverFile;
  result.coverPreview = URL.createObjectURL(coverFile);

  // 2. Recorta o Logotipo / Cabeçalho Superior (Topo 28% da Página 1)
  try {
    const logoCanvas = document.createElement("canvas");
    const logoCtx = logoCanvas.getContext("2d");

    if (logoCtx) {
      const cropHeight = Math.round(canvas.height * 0.28);
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

  // 3. Renderiza demais páginas como imagens adicionais (pratos e produtos)
  result.pageImages.push({
    file: coverFile,
    previewUrl: result.coverPreview,
    pageNumber: 1,
  });

  for (let p = 2; p <= numPages; p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const pageViewport = page.getViewport({ scale: 1.5 });
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

