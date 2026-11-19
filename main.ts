/**
 * Draw a deterministic newspaper-style PNG using only Node.js built-ins.
 * Run from the project folder with Node.js 22:
 *   node --experimental-strip-types main.ts
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { deflateSync } from "node:zlib";

type NewsItem = {
  category: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publicationDate: string;
};
type NewsData = { date: string; year: number; items: NewsItem[] };
type Color = [number, number, number];

const WIDTH = 960;
const HEIGHT = 960;
const OUTPUT_PATH = process.platform === "win32"
  ? join(process.cwd(), "output", "entry.png")
  : "/output/entry.png";

const PAPER: Color = [249, 247, 241];
const BLACK: Color = [25, 25, 24];
const GRAY: Color = [112, 108, 101];
const RULE: Color = [193, 187, 177];
const RED: Color = [174, 43, 39];
const PALE_RED: Color = [239, 224, 215];
const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

// Each character is five pixels wide by seven pixels high. Text is uppercased
// before drawing, which keeps this compact font useful for all supplied copy.
const FONT: Record<string, string[]> = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  ";": ["00000", "00110", "00110", "00000", "00110", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
};

function rectangle(x: number, y: number, width: number, height: number, color: Color): void {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(WIDTH, Math.ceil(x + width));
  const bottom = Math.min(HEIGHT, Math.ceil(y + height));
  for (let row = top; row < bottom; row++) {
    for (let col = left; col < right; col++) {
      const at = (row * WIDTH + col) * 3;
      pixels[at] = color[0];
      pixels[at + 1] = color[1];
      pixels[at + 2] = color[2];
    }
  }
}

function drawText(text: string, x: number, y: number, scale: number, color: Color): void {
  const normalized = text.toUpperCase();
  for (const [letterIndex, character] of [...normalized].entries()) {
    const glyph = FONT[character];
    if (!glyph) throw new Error(`Bitmap font is missing character: ${character}`);
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] === "1") {
          rectangle(x + letterIndex * 6 * scale + gx * scale, y + gy * scale, scale, scale, color);
        }
      }
    }
  }
}

// Wrap only at spaces, and fail loudly if the assigned box is too small.
function drawWrapped(text: string, x: number, y: number, maxWidth: number, maxHeight: number, scale: number, color: Color): number {
  const words = text.toUpperCase().trim().split(/\s+/);
  const charWidth = 6 * scale;
  const lineHeight = 9 * scale;
  const maxChars = Math.floor((maxWidth + scale) / charWidth);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ([...word].length > maxChars) throw new Error(`Word will not fit in its text area: ${word}`);
    const candidate = line ? `${line} ${word}` : word;
    if ([...candidate].length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length * lineHeight - scale > maxHeight) {
    throw new Error(`Text does not fit its assigned area: ${text}`);
  }
  lines.forEach((lineText, index) => drawText(lineText, x, y + index * lineHeight, scale, color));
  return lines.length * lineHeight;
}

function drawLeadIllustration(): void {
  // Abstract orbit and three bars provide a visual anchor without suggesting
  // any factual detail about the summit.
  const cx = 770;
  const cy = 365;
  const radius = 102;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const distance = x * x + y * y;
      if (distance <= radius * radius) rectangle(cx + x, cy + y, 1, 1, PALE_RED);
      if (distance <= (radius - 7) * (radius - 7)) rectangle(cx + x, cy + y, 1, 1, PAPER);
    }
  }
  rectangle(cx - 45, cy + 36, 18, 38, RED);
  rectangle(cx - 9, cy + 15, 18, 59, BLACK);
  rectangle(cx + 27, cy - 7, 18, 81, RED);
  rectangle(700, 454, 140, 2, RULE);
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(name: string, data: Buffer): Buffer {
  const type = Buffer.from(name, "ascii");
  const body = Buffer.concat([type, data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), 8 + data.length);
  return chunk;
}

function makePng(): Buffer {
  const scanlineSize = 1 + WIDTH * 3;
  const scanlines = Buffer.alloc(HEIGHT * scanlineSize);
  for (let row = 0; row < HEIGHT; row++) {
    const target = row * scanlineSize;
    scanlines[target] = 0; // PNG filter type 0: no filtering.
    pixels.copy(scanlines, target + 1, row * WIDTH * 3, (row + 1) * WIDTH * 3);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8; // Eight bits per color channel.
  header[9] = 2; // RGB truecolor.
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9, strategy: 0, memLevel: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function validateNews(news: NewsData): void {
  if (!Array.isArray(news.items) || news.items.length !== 3) {
    throw new Error("news.json must contain exactly three stories");
  }
  for (const [index, item] of news.items.entries()) {
    const n = index + 1;
    for (const field of ["category", "title", "summary", "sourceName", "publicationDate"] as const) {
      if (typeof item?.[field] !== "string" || item[field].trim() === "") {
        throw new Error(`News item ${n} must have a non-empty ${field}`);
      }
    }
    if (typeof item.sourceUrl !== "string" || item.sourceUrl.trim() === "") {
      throw new Error(`News item ${n} must have a source URL`);
    }
    try {
      const source = new URL(item.sourceUrl);
      if (source.protocol !== "http:" && source.protocol !== "https:") throw new Error();
    } catch {
      throw new Error(`News item ${n} must have a valid HTTP or HTTPS source URL`);
    }
    // Check every character before rendering so copy errors are clear.
    for (const character of `${item.category} ${item.title} ${item.summary} ${item.sourceName} ${item.publicationDate}`.toUpperCase()) {
      if (!FONT[character]) throw new Error(`Bitmap font is missing character: ${character}`);
    }
  }
}

function render(news: NewsData): void {
  rectangle(0, 0, WIDTH, HEIGHT, PAPER);

  drawText("WORLD IN FOCUS", 48, 32, 5, BLACK);
  rectangle(48, 82, 864, 5, RED);
  drawText(news.date, 48, 104, 2, BLACK);
  rectangle(48, 133, 864, 1, RULE);

  const lead = news.items[0];
  drawText(lead.category, 48, 158, 2, RED);
  drawWrapped(lead.title, 48, 188, 600, 118, 4, BLACK);
  drawWrapped(lead.summary, 48, 322, 570, 126, 2, BLACK);
  drawLeadIllustration();
  drawText(`SOURCE ${lead.sourceName} - NOV 19, 2026`, 48, 475, 1, GRAY);
  rectangle(48, 500, 864, 1, BLACK);

  const left = news.items[1];
  const right = news.items[2];
  drawText(left.category, 48, 526, 2, RED);
  drawWrapped(left.title, 48, 556, 410, 64, 3, BLACK);
  drawWrapped(left.summary, 48, 632, 410, 154, 2, BLACK);
  drawText(`SOURCE ${left.sourceName} - NOV 19, 2026`, 48, 801, 1, GRAY);

  rectangle(480, 520, 1, 320, RULE);
  drawText(right.category, 504, 526, 2, RED);
  drawWrapped(right.title, 504, 556, 408, 64, 3, BLACK);
  drawWrapped(right.summary, 504, 632, 408, 154, 2, BLACK);
  drawText(`SOURCE ${right.sourceName} - NOV 19, 2026`, 504, 801, 1, GRAY);

  rectangle(48, 846, 864, 1, BLACK);
  drawText("WORLD NEWS  /  THREE STORIES  /  NOVEMBER 19, 2026", 48, 865, 1, GRAY);
  rectangle(48, 894, 864, 4, RED);
}

async function main(): Promise<void> {
  const inputPath = resolve("news.json");
  const news = JSON.parse(await readFile(inputPath, "utf8")) as NewsData;
  validateNews(news);
  render(news);
  const png = makePng();
  if (png.length > 1024 * 1024) throw new Error("PNG exceeds the 1 MiB size limit");
  const output = resolve(OUTPUT_PATH);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, png);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
