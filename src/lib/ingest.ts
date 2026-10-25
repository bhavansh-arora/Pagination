import "server-only";
import * as cheerio from "cheerio";
import { safeFetch } from "./safe-fetch";

export const MAX_SOURCE_CHARS = 2_000_000;

export interface Extracted {
  title: string;
  text: string;
}

export function normalize(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, MAX_SOURCE_CHARS);
}

async function pdfToText(buf: Buffer) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: false });
  return (text as string[]).join("\n\n");
}

async function docxToText(buf: Buffer) {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return value;
}

function htmlToText(html: string): Extracted {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() || $("title").first().text().trim() || "";
  $("script,style,noscript,svg,iframe,form,nav,footer,header,aside,[aria-hidden=true]").remove();
  const root = $("article").first().length ? $("article").first() : $("main").first().length ? $("main").first() : $("body");
  root.find("br").replaceWith("\n");
  root.find("p,div,li,h1,h2,h3,h4,h5,h6,tr,section,blockquote,pre").each((_, el) => {
    $(el).append("\n");
  });
  root.find("h1,h2,h3").each((_, el) => {
    $(el).prepend("\n## ");
  });
  root.find("li").each((_, el) => {
    $(el).prepend("• ");
  });
  return { title, text: root.text() };
}

export async function extractFile(name: string, mime: string, buf: Buffer): Promise<Extracted> {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const title = name.replace(/\.[^.]+$/, "");
  let text: string;
  if (ext === "pdf" || mime === "application/pdf") text = await pdfToText(buf);
  else if (ext === "docx") text = await docxToText(buf);
  else if (ext === "html" || ext === "htm") text = htmlToText(buf.toString("utf8")).text;
  else if (["txt", "md", "markdown", "csv", "json", "srt", "vtt", "rtf", "tsv"].includes(ext) || mime.startsWith("text/"))
    text = buf.toString("utf8");
  else throw new Error(`Unsupported file type .${ext}. Use PDF, DOCX, TXT, MD, CSV, HTML or subtitles.`);
  text = normalize(text);
  if (!text) throw new Error("No readable text was found in that file");
  return { title, text };
}

export async function extractUrl(rawUrl: string): Promise<Extracted & { url: string }> {
  const page = await safeFetch(rawUrl);
  const host = new URL(page.url).hostname.replace(/^www\./, "");
  let out: Extracted;
  if (page.contentType.includes("pdf")) out = { title: host, text: await pdfToText(page.body) };
  else if (page.contentType.includes("html") || page.contentType.includes("xml"))
    out = htmlToText(page.body.toString("utf8"));
  else out = { title: host, text: page.body.toString("utf8") };
  const text = normalize(out.text);
  if (text.length < 40) throw new Error("Couldn't find readable text on that page (it may need JavaScript or a login)");
  return { url: page.url, title: (out.title || host).slice(0, 160), text };
}
