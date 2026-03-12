"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface Note {
  id: string;
  text: string;
  timestamp: number | null;
  isFlashcard: boolean;
  reviewDue: string | null;
  reviewInterval: number;
  createdAt: string;
}

interface Props {
  courseId: string;
  videoId: string;
  dark?: boolean;
  getCurrentTime?: () => number;
  seekTo?: (seconds: number) => void;
  /** Callback to open flashcard modal for this course */
  onOpenFlashcards?: () => void;
}

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Minimal markdown renderer with syntax highlighting */
function MarkdownView({ text, dark }: { text: string; dark: boolean }) {
  return (
    <div className={`prose prose-sm max-w-none break-words ${dark ? "prose-invert" : ""}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Inline code
          code({ className, children, ...props }) {
            const isBlock = Boolean(className);
            if (!isBlock) {
              return (
                <code
                  className={`px-1.5 py-0.5 rounded text-[12px] font-mono ${
                    dark ? "bg-white/10 text-orange-300" : "bg-orange-100 text-orange-700"
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Code block wrapper
          pre({ children, ...props }) {
            return (
              <pre
                className={`rounded-xl p-4 text-xs overflow-x-auto my-2 ${
                  dark ? "bg-black/40 border border-white/10" : "bg-slate-900 border border-slate-700"
                }`}
                {...props}
              >
                {children}
              </pre>
            );
          },
          p({ children }) {
            return <p className="leading-relaxed mb-1 last:mb-0">{children}</p>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function VideoNotes({
  courseId,
  videoId,
  dark = false,
  getCurrentTime,
  seekTo,
  onOpenFlashcards,
}: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [capturedTs, setCapturedTs] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNotes([]);
    setCapturedTs(null);
    setText("");
    setEditingId(null);
    setPreviewMode(false);

    fetch(`/api/notes?courseId=${courseId}&videoId=${videoId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotes(data); })
      .catch(() => {});
  }, [courseId, videoId]);

  function captureTimestamp() {
    const t = getCurrentTime?.() ?? 0;
    setCapturedTs(Math.floor(t));
    textareaRef.current?.focus();
  }

  function clearTimestamp() { setCapturedTs(null); }

  function sortNotes(arr: Note[]): Note[] {
    return [...arr].sort((a, b) => {
      if (a.timestamp != null && b.timestamp != null) return a.timestamp - b.timestamp;
      if (a.timestamp != null) return -1;
      if (b.timestamp != null) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  async function addNote() {
    const trimmed = text.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, videoId, text: trimmed, timestamp: capturedTs }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => sortNotes([...prev, note]));
        setText("");
        setCapturedTs(null);
      }
    });
  }

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
  }

  async function saveEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, text: trimmed } : n));
    setEditingId(null);
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
  }

  async function toggleFlashcard(note: Note) {
    const next = !note.isFlashcard;
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, isFlashcard: next } : n));
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFlashcard: next }),
    });
  }

  function exportNotes() {
    window.location.href = `/api/notes/export?courseId=${courseId}`;
  }

  const flashcardCount = notes.filter((n) => n.isFlashcard).length;

  const base = dark
    ? "bg-[#2d241d] border-white/10 text-slate-100"
    : "bg-white border-orange-50 text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const inputClass = dark
    ? "bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#e77e23]/60"
    : "bg-orange-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#e77e23]";
  const chipBtn = dark
    ? "border-white/10 text-slate-400 hover:text-[#e77e23] hover:border-[#e77e23]/30"
    : "border-slate-200 text-slate-500 hover:text-[#e77e23] hover:border-orange-200";

  return (
    <div className={`flex flex-col gap-4 rounded-xl border p-5 ${base}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#e77e23]">edit_note</span>
          <h3 className="font-bold text-base">Notes</h3>
          {notes.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-[#e77e23] font-semibold">
              {notes.length}
            </span>
          )}
          {flashcardCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${dark ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
              🃏 {flashcardCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onOpenFlashcards && flashcardCount > 0 && (
            <button
              onClick={onOpenFlashcards}
              title="Review flashcards for this course"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                dark
                  ? "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                  : "border-purple-200 text-purple-600 hover:bg-purple-50"
              }`}
            >
              <span className="material-symbols-outlined text-sm">style</span>
              Review
            </button>
          )}
          {notes.length > 0 && (
            <button
              onClick={exportNotes}
              title="Export notes as Markdown / Obsidian"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${chipBtn}`}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export .md
            </button>
          )}
          <span className={`text-xs ${muted}`}>Saved per video</span>
        </div>
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2">
        {capturedTs !== null && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#e77e23]/15 text-[#e77e23] px-2.5 py-1 rounded-full border border-[#e77e23]/30">
              <span className="material-symbols-outlined text-xs">timer</span>
              {fmtSeconds(capturedTs)}
            </span>
            <button onClick={clearTimestamp} className={`text-xs ${muted} hover:text-red-400 transition-colors`}>
              ✕ remove
            </button>
          </div>
        )}

        {/* Preview toggle */}
        {text.trim() && (
          <div className="flex gap-1 self-end">
            <button
              onClick={() => setPreviewMode(false)}
              className={`text-xs px-2.5 py-1 rounded-l-lg border transition-colors ${
                !previewMode
                  ? "bg-[#e77e23] text-white border-[#e77e23]"
                  : dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"
              }`}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`text-xs px-2.5 py-1 rounded-r-lg border transition-colors ${
                previewMode
                  ? "bg-[#e77e23] text-white border-[#e77e23]"
                  : dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"
              }`}
            >
              👁 Preview
            </button>
          </div>
        )}

        {previewMode && text.trim() ? (
          <div
            onClick={() => setPreviewMode(false)}
            className={`rounded-xl border px-4 py-3 cursor-text min-h-[72px] ${
              dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-orange-50/30"
            }`}
          >
            <MarkdownView text={text} dark={dark} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
            }}
            rows={3}
            placeholder={"Write a note… supports **Markdown** and ```code blocks```\n(⌘Enter to save)"}
            className={`w-full rounded-xl border px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[#e77e23]/20 transition-all font-mono ${inputClass}`}
          />
        )}

        <div className="flex gap-2">
          {getCurrentTime && (
            <button
              onClick={captureTimestamp}
              title="Capture current video timestamp"
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors font-medium ${chipBtn}`}
            >
              <span className="material-symbols-outlined text-sm">timer</span>
              {capturedTs !== null ? fmtSeconds(capturedTs) : "Timestamp"}
            </button>
          )}
          <button
            onClick={addNote}
            disabled={!text.trim() || isPending}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#e77e23] text-white text-sm font-semibold rounded-lg hover:bg-[#cf6f1f] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Save note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className={`text-sm text-center py-4 ${muted}`}>
          No notes yet for this video.
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`group rounded-xl p-3.5 border transition-colors ${
                note.isFlashcard
                  ? dark
                    ? "border-purple-500/30 bg-purple-900/20"
                    : "border-purple-200 bg-purple-50/60"
                  : dark
                  ? "border-white/5 bg-white/5 hover:bg-white/8"
                  : "border-orange-50 bg-orange-50/40 hover:bg-orange-50"
              }`}
            >
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(note.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none font-mono ${inputClass}`}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(note.id)} className="text-xs px-3 py-1.5 bg-[#e77e23] text-white rounded-lg font-semibold hover:bg-[#cf6f1f]">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className={`text-xs px-3 py-1.5 rounded-lg border ${dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    {note.timestamp != null && (
                      <button
                        onClick={() => seekTo?.(note.timestamp!)}
                        title="Jump to this moment"
                        className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#e77e23] bg-[#e77e23]/10 border border-[#e77e23]/20 px-2 py-0.5 rounded-full mb-1.5 hover:bg-[#e77e23]/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[10px]">play_circle</span>
                        {fmtSeconds(note.timestamp)}
                      </button>
                    )}
                    <MarkdownView text={note.text} dark={dark} />
                    <p className={`text-[11px] mt-1.5 ${muted}`}>{fmtDate(note.createdAt)}</p>
                  </div>

                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {/* Flashcard toggle */}
                    <button
                      onClick={() => toggleFlashcard(note)}
                      title={note.isFlashcard ? "Remove flashcard" : "Mark as flashcard"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.isFlashcard
                          ? "text-purple-500 bg-purple-100/40"
                          : dark
                          ? "text-slate-400 hover:text-purple-400 hover:bg-purple-400/10"
                          : "text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">style</span>
                    </button>
                    <button
                      onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                      title="Edit"
                      className={`p-1.5 rounded-lg transition-colors ${dark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      title="Delete"
                      className={`p-1.5 rounded-lg transition-colors ${dark ? "text-slate-500 hover:text-red-400 hover:bg-red-400/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
