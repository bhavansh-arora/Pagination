import "server-only";

export interface Chunk {
  sourceTitle: string;
  text: string;
}

const STOP = new Set(
  "a an and are as at be but by for from has have how i if in is it its me my of on or our so that the their them then there these they this to was we what when where which who why will with you your do does did can could should would am im ive about just not no yes get".split(" "),
);

export function tokenize(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => t.length > 1 && !STOP.has(t));
}

export function chunkText(sourceTitle: string, text: string, target = 1400): Chunk[] {
  const paras = text.split(/\n{2,}/);
  const chunks: Chunk[] = [];
  let buf: string[] = [];
  let len = 0;
  const flush = () => {
    if (buf.length) chunks.push({ sourceTitle, text: buf.join("\n\n") });
  };
  for (const raw of paras) {
    const p = raw.trim();
    if (!p) continue;
    if (p.length > target * 1.5) {
      flush();
      buf = [];
      len = 0;
      for (let i = 0; i < p.length; i += target) chunks.push({ sourceTitle, text: p.slice(Math.max(0, i - 150), i + target) });
      continue;
    }
    if (len + p.length > target && buf.length) {
      flush();
      const last = buf[buf.length - 1];
      buf = last.length < target / 3 ? [last] : [];
      len = buf.reduce((n, s) => n + s.length, 0);
    }
    buf.push(p);
    len += p.length;
  }
  flush();
  return chunks;
}

/** BM25 ranking over chunks; returns the best matches for the query. */
export function rank(chunks: Chunk[], query: string, k = 12): Chunk[] {
  const q = [...new Set(tokenize(query))];
  if (!q.length || !chunks.length) return [];
  const docs = chunks.map((c) => tokenize(`${c.sourceTitle} ${c.text}`));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) if (q.includes(t)) df.set(t, (df.get(t) ?? 0) + 1);
  const k1 = 1.4;
  const b = 0.75;
  const scored = docs.map((d, i) => {
    const tf = new Map<string, number>();
    for (const t of d) if (df.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      const n = df.get(t)!;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avg)));
    }
    return { i, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => chunks[s.i]);
}
