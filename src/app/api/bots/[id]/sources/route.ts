import { nanoid } from "nanoid";
import { z } from "zod";
import { mutate, read, writeSourceText, type Source, type SourceKind } from "@/lib/db";
import { extractFile, extractUrl, normalize } from "@/lib/ingest";
import { fail, json, ownedBot } from "@/lib/api";
import { FULL_MEMORY_CHARS } from "@/lib/brain";

export const maxDuration = 120;
type Ctx = { params: Promise<{ id: string }> };

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_CHARS = 20_000_000;

export async function GET(_: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const sources = (await read()).sources.filter((s) => s.botId === r.bot.id);
  return json({ sources, fullMemoryChars: FULL_MEMORY_CHARS });
}

async function store(botId: string, kind: SourceKind, title: string, origin: string, text: string) {
  const id = nanoid();
  await writeSourceText(id, text);
  const source: Source = { id, botId, kind, title: title.slice(0, 160) || "Untitled", origin, chars: text.length, createdAt: new Date().toISOString() };
  await mutate((d) => {
    d.sources.push(source);
  });
  return source;
}

const TextBody = z.object({ kind: z.literal("text"), title: z.string().trim().min(1).max(160), text: z.string().min(1).max(500_000) });
const UrlBody = z.object({ kind: z.literal("url"), url: z.string().trim().url().max(2000) });

export async function POST(req: Request, { params }: Ctx) {
  const r = await ownedBot((await params).id);
  if (r instanceof Response) return r;
  const used = (await read()).sources.filter((s) => s.botId === r.bot.id).reduce((n, s) => n + s.chars, 0);
  if (used > MAX_TOTAL_CHARS) return fail("This mind's knowledge library is full");

  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("No file received");
      if (file.size > MAX_FILE_BYTES) return fail("Files can be up to 25 MB");
      const { title, text } = await extractFile(file.name, file.type, Buffer.from(await file.arrayBuffer()));
      return json({ source: await store(r.bot.id, "file", title, file.name, text) }, 201);
    }
    const body = await req.json().catch(() => null);
    const asText = TextBody.safeParse(body);
    if (asText.success) {
      const text = normalize(asText.data.text);
      if (!text) return fail("Write something first");
      return json({ source: await store(r.bot.id, "text", asText.data.title, "Written note", text) }, 201);
    }
    const asUrl = UrlBody.safeParse(body);
    if (asUrl.success) {
      const page = await extractUrl(asUrl.data.url);
      return json({ source: await store(r.bot.id, "url", page.title, page.url, page.text) }, 201);
    }
    return fail("Add a file, a link or a note");
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Couldn't import that", 422);
  }
}
