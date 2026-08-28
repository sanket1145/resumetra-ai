/**
 * Browser-side document text extraction.
 *
 * PDF files are read with pdf.js and DOCX files with mammoth. Both libraries
 * are dynamically imported so they never load during server rendering.
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

export type ResumeFileType = "pdf" | "docx";

export class ExtractionError extends Error {}

export function detectFileType(file: File): ResumeFileType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  return null;
}

export function validateFile(file: File): string | null {
  if (!detectFileType(file)) {
    return "Unsupported file type. Please upload a PDF or DOCX resume.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "This file is larger than 5 MB. Please upload a smaller PDF or DOCX file.";
  }
  if (file.size === 0) {
    return "This file appears to be empty.";
  }
  return null;
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + (item.hasEOL ? " " : "");
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }
  await doc.destroy();
  return pages.join("\n\n");
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function extractResumeText(file: File): Promise<{ text: string; type: ResumeFileType }> {
  const type = detectFileType(file);
  if (!type) throw new ExtractionError("Unsupported file type. Please upload a PDF or DOCX resume.");

  const buffer = await file.arrayBuffer();
  let text = "";
  try {
    text = type === "pdf" ? await extractPdf(buffer) : await extractDocx(buffer);
  } catch {
    throw new ExtractionError(
      "Unable to extract readable text from this document. Please upload a text-based PDF or DOCX resume.",
    );
  }

  if (text.replace(/\s+/g, "").length < 100) {
    throw new ExtractionError(
      "Unable to extract readable text from this document. Please upload a text-based PDF or DOCX resume.",
    );
  }
  return { text, type };
}
