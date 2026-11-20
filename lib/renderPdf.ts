const PDF_URL = "/carol-flipbook.pdf";

let cachedPages: Promise<HTMLCanvasElement[]> | null = null;

export function renderPdfPages(
  onProgress?: (done: number, total: number) => void,
): Promise<HTMLCanvasElement[]> {
  if (!cachedPages) {
    cachedPages = rasterize(PDF_URL, onProgress).catch((error: unknown) => {
      cachedPages = null;
      throw error;
    });
  } else if (onProgress) {
    void cachedPages.then((pages) => onProgress(pages.length, pages.length));
  }

  return cachedPages;
}

async function rasterize(
  url: string,
  onProgress?: (done: number, total: number) => void,
): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjs.getDocument({ url }).promise;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = Math.min(560, Math.max(window.innerWidth, 360));
  const sample = await pdf.getPage(1);
  const scale = (cssWidth * dpr) / sample.getViewport({ scale: 1 }).width;
  const canvases: HTMLCanvasElement[] = [];

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = index === 1 ? sample : await pdf.getPage(index);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not draw a page");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, viewport }).promise;

    canvases.push(canvas);
    onProgress?.(index, pdf.numPages);
  }

  return canvases;
}
