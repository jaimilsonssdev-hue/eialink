import * as pdfjsLib from "pdfjs-dist";

// Configura o worker do PDF.js para navegadores modernos
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

export interface ExtractedEmbeddedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  name: string;
  isLikelyLogo?: boolean;
}

export interface ExtractedPdfAssets {
  logoFile?: File;
  logoPreview?: string;
  coverFile?: File;
  coverPreview?: string;
  extractedText?: string;
  embeddedImages: ExtractedEmbeddedImage[];
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
 * Recupera um objeto de imagem do PDF.js (seja local na página ou compartilhado no documento)
 */
function getPdfImageObject(page: any, pdfDoc: any, objId: string): Promise<any> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (obj: any) => {
      if (!resolved) {
        resolved = true;
        resolve(obj);
      }
    };

    const timer = setTimeout(() => finish(null), 2000);

    try {
      if (page.objs && typeof page.objs.get === "function") {
        page.objs.get(objId, (obj: any) => {
          clearTimeout(timer);
          finish(obj);
        });
        return;
      }

      if (pdfDoc.commonObjs && typeof pdfDoc.commonObjs.get === "function") {
        pdfDoc.commonObjs.get(objId, (obj: any) => {
          clearTimeout(timer);
          finish(obj);
        });
        return;
      }

      clearTimeout(timer);
      finish(null);
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}

/**
 * Converte um objeto de imagem extraído do PDF (ImageBitmap, HTMLImageElement ou Buffer de Pixels)
 * em um File PNG limpo e utilizável no navegador.
 */
async function convertPdfImageToFile(imgObj: any, filename: string): Promise<File | null> {
  if (!imgObj) return null;

  try {
    // 1. Caso seja ImageBitmap ou HTMLImageElement
    if (imgObj.bitmap || (typeof ImageBitmap !== "undefined" && imgObj instanceof ImageBitmap)) {
      const bmp = imgObj.bitmap || imgObj;
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bmp, 0, 0);
      return await canvasToFile(canvas, filename, "image/png");
    }

    // 2. Caso contenha buffer de pixels nativo (Uint8ClampedArray ou Uint8Array)
    const width = imgObj.width;
    const height = imgObj.height;
    const rawData = imgObj.data;

    if (!width || !height || !rawData) return null;

    // Filtra artefatos minúsculos (bullets, linhas decorativas de 1px)
    if (width < 80 || height < 80) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let imgData: ImageData;

    if (rawData.length === width * height * 4) {
      // RGBA direto
      imgData = new ImageData(new Uint8ClampedArray(rawData), width, height);
    } else if (rawData.length === width * height * 3) {
      // RGB -> RGBA
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0, j = 0; i < rawData.length; i += 3, j += 4) {
        rgba[j] = rawData[i];
        rgba[j + 1] = rawData[i + 1];
        rgba[j + 2] = rawData[i + 2];
        rgba[j + 3] = 255;
      }
      imgData = new ImageData(rgba, width, height);
    } else if (rawData.length === width * height) {
      // Grayscale 1 canal -> RGBA
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0, j = 0; i < rawData.length; i++, j += 4) {
        const val = rawData[i];
        rgba[j] = val;
        rgba[j + 1] = val;
        rgba[j + 2] = val;
        rgba[j + 3] = 255;
      }
      imgData = new ImageData(rgba, width, height);
    } else {
      return null;
    }

    ctx.putImageData(imgData, 0, 0);
    return await canvasToFile(canvas, filename, "image/png");
  } catch (err) {
    console.warn("Erro ao converter imagem embutida do PDF:", err);
    return null;
  }
}

/**
 * Processa um arquivo PDF diretamente no navegador:
 * 1. Extrai o texto semântico completo de todas as páginas (cardápios, preços, descrições, telefones).
 * 2. Extrai os fluxos binários de imagens nativas (XObjects) em alta resolução (fotos isoladas de pratos, produtos e logos).
 * 3. Renderiza páginas de fallback em alta resolução se o PDF for achatado ou escaneado.
 */
export async function extractAssetsFromPdf(pdfFile: File): Promise<ExtractedPdfAssets> {
  if (typeof window === "undefined") {
    return { embeddedImages: [], pageImages: [] };
  }

  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const maxPagesToProcess = Math.min(totalPages, 6);

  const result: ExtractedPdfAssets = {
    embeddedImages: [],
    pageImages: [],
    extractedText: "",
  };

  const baseName = pdfFile.name.replace(/\.[^.]+$/, "");

  // 1. Extração Completa de Texto Semântico
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

  // 2. Extração Real de Imagens Nativas (XObjects / Image Streams)
  const seenImageKeys = new Set<string>();
  const extractedEmbedded: ExtractedEmbeddedImage[] = [];

  for (let p = 1; p <= maxPagesToProcess; p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const ops = await page.getOperatorList();
      const imageOpIndexes: number[] = [];

      // Procura operadores de imagem nativa no PDF
      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        if (
          fn === pdfjsLib.OPS.paintImageXObject ||
          fn === pdfjsLib.OPS.paintInlineImageXObject ||
          fn === pdfjsLib.OPS.paintImageMaskXObject
        ) {
          imageOpIndexes.push(i);
        }
      }

      for (const opIdx of imageOpIndexes) {
        const imgName = ops.argsArray[opIdx]?.[0];
        if (!imgName) continue;

        const imgKey = `${imgName}`;
        if (seenImageKeys.has(imgKey)) continue;
        seenImageKeys.add(imgKey);

        const imgObj = await getPdfImageObject(page, pdfDoc, imgName);
        if (!imgObj) continue;

        const w = imgObj.width || imgObj.bitmap?.width || 0;
        const h = imgObj.height || imgObj.bitmap?.height || 0;

        // Filtra imagens irrelevantes (menores que 80px ou com aspecto extremo de linha)
        if (w < 80 || h < 80) continue;
        const ratio = w / h;
        if (ratio > 8 || ratio < 0.12) continue;

        const filename = `${baseName}-img-${extractedEmbedded.length + 1}-${w}x${h}.png`;
        const file = await convertPdfImageToFile(imgObj, filename);

        if (file) {
          const previewUrl = URL.createObjectURL(file);
          // Critério heurístico para candidatos a logo: tamanho médio/quadrado ou wide elegante na página 1
          const isLikelyLogo =
            (p === 1 && w >= 100 && w <= 800 && h >= 60 && h <= 500 && ratio >= 0.7 && ratio <= 4.0) ||
            imgName.toLowerCase().includes("logo");

          extractedEmbedded.push({
            file,
            previewUrl,
            width: w,
            height: h,
            name: filename,
            isLikelyLogo,
          });
        }
      }
    } catch (embErr) {
      console.warn(`Aviso ao extrair imagens embutidas da página ${p}:`, embErr);
    }
  }

  result.embeddedImages = extractedEmbedded;

  // Se encontramos imagens embutidas reais, definimos o melhor candidato para Logo e Capa:
  if (extractedEmbedded.length > 0) {
    // 1º Candidato a Logo: marcado como likelyLogo ou o menor/quadrado na página 1
    const logoCandidate = extractedEmbedded.find((img) => img.isLikelyLogo) || extractedEmbedded[0];
    if (logoCandidate) {
      result.logoFile = logoCandidate.file;
      result.logoPreview = logoCandidate.previewUrl;
    }

    // 1º Candidato a Capa: a imagem de maior resolução e impacto visual
    const sortedBySize = [...extractedEmbedded].sort((a, b) => b.width * b.height - a.width * a.height);
    const coverCandidate = sortedBySize.find((img) => img !== logoCandidate) || sortedBySize[0];
    if (coverCandidate) {
      result.coverFile = coverCandidate.file;
      result.coverPreview = coverCandidate.previewUrl;
    }
  }

  // 3. Renderização de Páginas Completas (como backup para PDFs achatados ou escaneados)
  try {
    const page1 = await pdfDoc.getPage(1);
    const viewport = page1.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderContext: any = { canvasContext: ctx, viewport };
      await page1.render(renderContext).promise;

      const coverFileName = `${baseName}-pagina-1.png`;
      const coverFile = await canvasToFile(canvas, coverFileName, "image/png");
      const coverUrl = URL.createObjectURL(coverFile);

      // Se não havia imagens embutidas no PDF, usa a folha da página 1 como capa
      if (!result.coverFile) {
        result.coverFile = coverFile;
        result.coverPreview = coverUrl;
      }

      result.pageImages.push({
        file: coverFile,
        previewUrl: coverUrl,
        pageNumber: 1,
      });

      // Se também não temos logo de imagem embutida, aí sim fazemos o recorte inteligente de topo como fallback
      if (!result.logoFile) {
        try {
          const logoCanvas = document.createElement("canvas");
          const logoCtx = logoCanvas.getContext("2d");
          if (logoCtx) {
            const cropHeight = Math.round(canvas.height * 0.28);
            const cropWidth = canvas.width;
            logoCanvas.width = cropWidth;
            logoCanvas.height = cropHeight;
            logoCtx.drawImage(canvas, 0, 0, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            const fallbackLogoFile = await canvasToFile(logoCanvas, `${baseName}-topo-logo.png`, "image/png");
            result.logoFile = fallbackLogoFile;
            result.logoPreview = URL.createObjectURL(fallbackLogoFile);
          }
        } catch {
          // ignore fallback crop error
        }
      }
    }
  } catch (p1Err) {
    console.warn("Erro ao renderizar primeira página do PDF:", p1Err);
  }

  // Se não encontramos imagens embutidas (PDF escaneado/folheto), renderiza as páginas restantes
  if (extractedEmbedded.length === 0) {
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
          const pRenderContext: any = { canvasContext: pCtx, viewport: pageViewport };
          await page.render(pRenderContext).promise;

          const pFileName = `${baseName}-pagina-${p}.png`;
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
  }

  return result;
}
