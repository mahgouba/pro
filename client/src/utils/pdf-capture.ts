import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function waitForCaptureAssets(element: HTMLElement) {
  try {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  } catch {}

  const images = Array.from(element.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(() => resolve(), 3000);
      });
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 250));
}

export function normalizeArabicForCapture(clonedDoc: Document) {
  try {
    const all = clonedDoc.querySelectorAll<HTMLElement>("*");
    all.forEach((el) => {
      el.style.letterSpacing = "normal";
      (el.style as any).fontKerning = "normal";
      (el.style as any).fontFeatureSettings = '"liga" 1, "calt" 1';
      el.style.textRendering = "geometricPrecision";
    });
  } catch (e) {
    console.warn("normalizeArabicForCapture failed", e);
  }
}

export function getCaptureScale() {
  const dpr = Math.max(window.devicePixelRatio || 1, 2);
  return Math.min(Math.max(dpr * 1.5, 3), 4);
}

export async function captureElementToCanvas(
  element: HTMLElement,
  options: Partial<Parameters<typeof html2canvas>[1]> = {}
): Promise<HTMLCanvasElement> {
  await waitForCaptureAssets(element);

  return html2canvas(element, {
    scale: getCaptureScale(),
    logging: false,
    allowTaint: true,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    imageTimeout: 15000,
    removeContainer: true,
    foreignObjectRendering: false,
    onclone: (clonedDoc) => normalizeArabicForCapture(clonedDoc),
    ...options,
  } as any);
}

export function canvasToA4Pdf(canvas: HTMLCanvasElement, element: HTMLElement): jsPDF {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  const elementWidth = element.scrollWidth;
  const elementHeight = element.scrollHeight;
  const widthRatio = pdfWidth / elementWidth;
  const heightRatio = pdfHeight / elementHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  const imgWidth = elementWidth * ratio;
  const imgHeight = elementHeight * ratio;
  const x = (pdfWidth - imgWidth) / 2;
  const y = (pdfHeight - imgHeight) / 2;

  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, "SLOW");

  return pdf;
}
