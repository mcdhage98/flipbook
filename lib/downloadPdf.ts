import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import type { CoverDetails } from "@/lib/cover";

const WIN_ANSI =
  /[\u2018\u2019\u201C\u201D\u2013\u2014\u2026\u00A0]|[^\n\r\t\x20-\x7E\xA0-\xFF]/g;

const REPLACEMENTS: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
};

export async function downloadFlipbook(details: CoverDetails): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const response = await fetch("/carol-flipbook.pdf");
  if (!response.ok) {
    throw new Error("Could not read the original guide");
  }

  const source = await PDFDocument.load(await response.arrayBuffer());
  const [sample] = source.getPages();
  const { width, height } = sample.getSize();
  const output = await PDFDocument.create();
  const cover = output.addPage([width, height]);
  const body = await output.embedFont(StandardFonts.TimesRoman);
  const bold = await output.embedFont(StandardFonts.TimesRomanBold);
  const italic = await output.embedFont(StandardFonts.TimesRomanItalic);

  const cream = rgb(0.973, 0.957, 0.922);
  const cyan = rgb(0.365, 0.89, 0.894);
  const yellow = rgb(1, 0.878, 0.361);
  const night = rgb(0.067, 0.078, 0.137);
  const card = rgb(0.09, 0.1, 0.16);

  cover.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: night,
  });
  cover.drawCircle({ x: 18, y: 36, size: 86, color: cyan });
  cover.drawCircle({ x: width + 8, y: 8, size: 108, color: yellow });
  cover.drawRectangle({
    x: 28,
    y: 58,
    width: width - 56,
    height: height - 96,
    color: card,
    borderColor: cyan,
    borderWidth: 2.4,
  });

  const margin = 58;
  const contentWidth = width - margin * 2;
  let cursor = height - 92;

  cover.drawText("30 DAYS OF INTENTIONAL CARE", {
    x: margin,
    y: cursor,
    size: 10,
    font: bold,
    color: yellow,
  });
  cursor -= 46;
  cover.drawText("Leading from", {
    x: margin,
    y: cursor,
    size: 34,
    font: bold,
    color: cream,
  });
  cursor -= 40;
  cover.drawText("The Inside Out", {
    x: margin,
    y: cursor,
    size: 34,
    font: bold,
    color: cream,
  });
  cursor -= 28;
  cover.drawText("A self-coaching guide", {
    x: margin,
    y: cursor,
    size: 12,
    font: italic,
    color: cyan,
  });
  cursor -= 16;
  cover.drawText("for doing what matters most", {
    x: margin,
    y: cursor,
    size: 12,
    font: italic,
    color: cyan,
  });
  cursor -= 18;
  cover.drawLine({
    start: { x: margin, y: cursor },
    end: { x: margin + 72, y: cursor },
    thickness: 2,
    color: yellow,
  });
  cursor -= 36;

  cursor = drawField(cover, "Name", details.name, {
    y: cursor,
    margin,
    contentWidth,
    labelFont: bold,
    valueFont: body,
    ink: cream,
    muted: cyan,
    line: cyan,
    maxLines: 2,
  });
  cursor = drawField(cover, "Start date", formatDate(details.date), {
    y: cursor,
    margin,
    contentWidth,
    labelFont: bold,
    valueFont: body,
    ink: cream,
    muted: cyan,
    line: cyan,
    maxLines: 1,
  });
  cursor = drawField(cover, "Intention", details.intention, {
    y: cursor,
    margin,
    contentWidth,
    labelFont: bold,
    valueFont: body,
    ink: cream,
    muted: cyan,
    line: cyan,
    maxLines: 2,
  });
  drawField(cover, "Note to yourself", details.note, {
    y: cursor,
    margin,
    contentWidth,
    labelFont: bold,
    valueFont: italic,
    ink: cream,
    muted: cyan,
    line: cyan,
    maxLines: 8,
  });

  const footer = "Personal copy";
  cover.drawText(footer, {
    x: margin,
    y: 74,
    size: 10,
    font: italic,
    color: cyan,
  });

  const pages = await output.copyPages(source, source.getPageIndices());
  for (const page of pages) {
    output.addPage(page);
  }

  const bytes = await output.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "carol-flipbook.pdf";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return toWinAnsi(value);

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toWinAnsi(value: string): string {
  return value.replace(WIN_ANSI, (char) => REPLACEMENTS[char] ?? "");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
        continue;
      }

      if (current) lines.push(current);
      current = fitWord(word, font, size, maxWidth, lines);
    }

    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

function fitWord(
  word: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lines: string[],
): string {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) return word;

  let chunk = "";
  for (const char of word) {
    const trial = chunk + char;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && chunk) {
      lines.push(chunk);
      chunk = char;
    } else {
      chunk = trial;
    }
  }

  return chunk;
}

function drawField(
  page: PDFPage,
  label: string,
  value: string,
  options: {
    y: number;
    margin: number;
    contentWidth: number;
    labelFont: PDFFont;
    valueFont: PDFFont;
    ink: RGB;
    muted: RGB;
    line: RGB;
    maxLines: number;
  },
): number {
  const text = toWinAnsi(value).trim();
  let y = options.y;

  page.drawText(label.toUpperCase(), {
    x: options.margin,
    y,
    size: 9,
    font: options.labelFont,
    color: options.muted,
  });
  y -= 16;

  if (!text) {
    page.drawLine({
      start: { x: options.margin, y: y - 2 },
      end: { x: options.margin + options.contentWidth, y: y - 2 },
      thickness: 0.6,
      color: options.line,
    });
    return y - 28;
  }

  const lines = wrapText(text, options.valueFont, 14, options.contentWidth).slice(
    0,
    options.maxLines,
  );
  for (const line of lines) {
    page.drawText(line, {
      x: options.margin,
      y,
      size: 14,
      font: options.valueFont,
      color: options.ink,
    });
    y -= 18;
  }

  return y - 14;
}
