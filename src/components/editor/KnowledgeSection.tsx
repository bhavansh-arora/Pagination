"use client";
import { useRef, useState } from "react";
import { CircleAlert, Eye, FileText, Globe, Link2, Loader2, NotebookPen, Search, Trash2, UploadCloud, X, Zap } from "lucide-react";
import type { Source } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button, Card, Field, Input, Textarea } from "../ui";
import { PageTitle } from "./sections";

type Job = { id: string; label: string; status: "working" | "error"; error?: string };
type Mode = "files" | "links" | "note";

const NOTE_IDEAS = ["My signature framework", "Frequently asked questions", "My story", "Programs & how to work with me", "Client success stories"];

const words = (chars: number) => Math.max(1, Math.round(chars / 5.5));

export function KnowledgeSection({
  botId,
  sources,
  setSources,
  fullMemoryChars,
}: {
  botId: string;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  fullMemoryChars: number;
}) {
  const [mode, setMode] = useState<Mode>("files");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [links, setLinks] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [drag, setDrag] = useState(false);
  const [filter, setFilter] = useState("");
  const [viewing, setViewing] = useState<{ source: Source; preview: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = sources.reduce((n, s) => n + s.chars, 0);
  const full = total <= fullMemoryChars;

  async function run(label: string, req: () => Promise<Response>) {
    const id = Math.random().toString(36).slice(2);
    setJobs((j) => [...j, { id, label, status: "working" }]);
    try {
      const res = await req();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setSources((s) => [data.source, ...s]);
      setJobs((j) => j.filter((x) => x.id !== id));
      return true;
    } catch (err) {
      setJobs((j) => j.map((x) => (x.id === id ? { ...x, status: "error", error: (err as Error).message } : x)));
      return false;
    }
  }

  function uploadFiles(files: FileList | File[]) {
    for (const f of Array.from(files)) {
      run(f.name, () => {
        const form = new FormData();
        form.append("file", f);
        return fetch(`/api/bots/${botId}/sources`, { method: "POST", body: form });
      });
    }
  }

  async function addLinks() {
    const urls = links
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      .map((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`));
    setLinks("");
    await Promise.all(
      urls.map((url) =>
        run(url.replace(/^https?:\/\//, ""), () =>
          fetch(`/api/bots/${botId}/sources`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "url", url }) }),
        ),
      ),
    );
  }

  async function addNote() {
    const ok = await run(noteTitle, () =>
      fetch(`/api/bots/${botId}/sources`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "text", title: noteTitle, text: noteText }),
      }),
    );
    if (ok) {
      setNoteTitle("");
      setNoteText("");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this from your mind's knowledge?")) return;
    const res = await fetch(`/api/bots/${botId}/sources/${id}`, { method: "DELETE" });
    if (res.ok) setSources((s) => s.filter((x) => x.id !== id));
  }

  async function view(source: Source) {
    const res = await fetch(`/api/bots/${botId}/sources/${source.id}`);
    if (res.ok) setViewing({ source, preview: (await res.json()).preview });
  }

  const visible = sources.filter((s) => !filter || `${s.title} ${s.origin}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <PageTitle title="Knowledge" subtitle="Everything your mind knows. Add your courses, workbooks, blog posts, transcripts and notes." />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Sources" value={sources.length.toLocaleString()} />
        <Stat label="Words learned" value={words(total).toLocaleString()} />
        <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Zap className={cn("size-3.5", full ? "text-emerald-500" : "text-violet-500")} /> {full ? "Full memory" : "Smart recall"}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn("h-full rounded-full", full ? "bg-emerald-500" : "bg-violet-500")}
              style={{ width: `${Math.min(100, (total / fullMemoryChars) * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-muted">
            {full ? "Reads everything on every message." : "Library is large — pulls the most relevant passages."}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex border-b border-line">
          {(
            [
              ["files", UploadCloud, "Upload files"],
              ["links", Link2, "Add links"],
              ["note", NotebookPen, "Write a note"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3.5 text-sm font-medium transition",
                mode === id ? "border-violet-600 text-violet-800" : "border-transparent text-muted hover:text-ink",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {mode === "files" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                uploadFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                drag ? "border-violet-500 bg-violet-50" : "border-zinc-200 hover:border-violet-300 hover:bg-violet-50/30",
              )}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-600">
                <UploadCloud className="size-6" />
              </span>
              <div className="mt-3 font-semibold">Drop files here or click to browse</div>
              <div className="mt-1 text-xs text-muted">PDF, Word (.docx), TXT, Markdown, CSV, HTML, subtitles (.srt/.vtt) · up to 25 MB each</div>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.srt,.vtt"
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {mode === "links" && (
            <div className="space-y-3">
              <Field label="Web pages" hint="Paste one or more links — blog posts, sales pages, podcast show notes, public docs. One per line.">
                <Textarea
                  rows={4}
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder={"https://yoursite.com/blog/my-framework\nhttps://yoursite.com/about"}
                  className="font-mono text-[13px]"
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={addLinks} disabled={!links.trim()}>
                  <Globe className="size-4" /> Import links
                </Button>
              </div>
            </div>
          )}
          {mode === "note" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {NOTE_IDEAS.map((idea) => (
                  <button key={idea} onClick={() => setNoteTitle(idea)} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 hover:bg-violet-100 hover:text-violet-800">
                    {idea}
                  </button>
                ))}
              </div>
              <Field label="Title">
                <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} maxLength={160} placeholder="My 5-step clarity framework" />
              </Field>
              <Field label="Content" hint="Write like you'd explain it to a client. Q&A format works great.">
                <Textarea rows={8} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Step 1 — Name the real problem…" />
              </Field>
              <div className="flex justify-end">
                <Button onClick={addNote} disabled={!noteTitle.trim() || !noteText.trim()}>
                  <NotebookPen className="size-4" /> Save note
                </Button>
              </div>
            </div>
          )}

          {jobs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm", j.status === "error" ? "border-rose-200 bg-rose-50" : "border-line bg-zinc-50")}
                >
                  {j.status === "working" ? <Loader2 className="size-4 animate-spin text-violet-600" /> : <CircleAlert className="size-4 text-rose-600" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{j.label}</span>
                    <span className={cn("block text-xs", j.status === "error" ? "text-rose-700" : "text-muted")}>
                      {j.status === "error" ? j.error : "Reading & learning…"}
                    </span>
                  </span>
                  {j.status === "error" && (
                    <button onClick={() => setJobs((x) => x.filter((y) => y.id !== j.id))} className="rounded p-1 text-muted hover:text-ink" aria-label="Dismiss">
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="mt-8 mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Library</h3>
        {sources.length > 4 && (
          <div className="relative w-56">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" className="h-9 pl-8 text-[13px]" />
          </div>
        )}
      </div>
      {sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/50 px-6 py-10 text-center text-sm text-muted">
          Nothing yet. Start with your best piece of content — your signature program, a workbook, or your most popular post.
        </div>
      ) : (
        <Card className="divide-y divide-line">
          {visible.map((s) => {
            const Icon = s.kind === "url" ? Globe : s.kind === "text" ? NotebookPen : FileText;
            return (
              <div key={s.id} className="group flex items-center gap-3.5 px-4 py-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    s.kind === "url" ? "bg-sky-50 text-sky-600" : s.kind === "text" ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="truncate text-xs text-muted">
                    {s.kind === "url" ? s.origin.replace(/^https?:\/\//, "") : s.origin} · {words(s.chars).toLocaleString()} words ·{" "}
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-60 transition group-hover:opacity-100">
                  <button onClick={() => view(s)} className="rounded-lg p-2 text-muted hover:bg-zinc-100 hover:text-ink" aria-label="Preview">
                    <Eye className="size-4" />
                  </button>
                  <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="flex max-h-[80vh] w-full max-w-2xl animate-fade-up flex-col rounded-3xl border border-line bg-white shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{viewing.source.title}</h3>
                <p className="mt-0.5 text-xs text-muted">What your mind extracted ({words(viewing.source.chars).toLocaleString()} words) — first part shown</p>
              </div>
              <button onClick={() => setViewing(null)} className="rounded-lg p-1.5 text-muted hover:bg-zinc-100" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <pre className="scrollbar-thin overflow-y-auto p-5 font-sans text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-700">{viewing.preview}</pre>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
