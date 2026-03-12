"use client";

import { useState, useEffect, useTransition, useRef } from "react";

interface Note {
  id: string;
  text: string;
  timestamp: number | null;
  createdAt: string;
}

interface Props {
  courseId: string;
  videoId: string;
  dark?: boolean;
  /** Called to get the current playback position in seconds */
  getCurrentTime?: () => number;
  /** Called to seek the player to a given second */
  seekTo?: (seconds: number) => void;
}

/** Format seconds → "1:23:45" or "23:45" */
function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Format ISO date → "Mar 11, 22:45" */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function VideoNotes({ courseId, videoId, dark = false, getCurrentTime, seekTo }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [capturedTs, setCapturedTs] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes when video changes
  useEffect(() => {
    setNotes([]);
    setCapturedTs(null);
    setText("");
    setEditingId(null);

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
        setNotes((prev) => [...prev, note].sort((a, b) => {
          if (a.timestamp != null && b.timestamp != null) return a.timestamp - b.timestamp;
          if (a.timestamp != null) return -1;
          if (b.timestamp != null) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }));
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

  const base = dark
    ? "bg-[#2d241d] border-white/10 text-slate-100"
    : "bg-white border-orange-50 text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const inputClass = dark
    ? "bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-[#e77e23]/60"
    : "bg-orange-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#e77e23]";

  return (
    <div className={`flex flex-col gap-4 rounded-xl border p-5 ${base}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#e77e23]">edit_note</span>
          <h3 className="font-bold text-base">Notes</h3>
          {notes.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-[#e77e23] font-semibold">
              {notes.length}
            </span>
          )}
        </div>
        <span className={`text-xs ${muted}`}>Saved per video</span>
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2">
        {/* Timestamp badge */}
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

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
          }}
          rows={2}
          placeholder="Write a note… (⌘Enter to save)"
          className={`w-full rounded-xl border px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[#e77e23]/20 transition-all ${inputClass}`}
        />

        <div className="flex gap-2">
          {/* Capture timestamp button */}
          {getCurrentTime && (
            <button
              onClick={captureTimestamp}
              title="Capture current video timestamp"
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors font-medium
                ${dark
                  ? "border-white/10 text-slate-400 hover:text-[#e77e23] hover:border-[#e77e23]/30"
                  : "border-slate-200 text-slate-500 hover:text-[#e77e23] hover:border-orange-200"
                }`}
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
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`group rounded-xl p-3.5 border transition-colors ${
                dark
                  ? "border-white/5 bg-white/5 hover:bg-white/8"
                  : "border-orange-50 bg-orange-50/40 hover:bg-orange-50"
              }`}
            >
              {editingId === note.id ? (
                /* Edit mode */
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(note.id); if (e.key === "Escape") setEditingId(null); }}
                    autoFocus
                    rows={2}
                    className={`w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none ${inputClass}`}
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
                /* View mode */
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Timestamp chip — clickable to seek */}
                    {note.timestamp != null && (
                      <button
                        onClick={() => seekTo?.(note.timestamp!)}
                        title="Jump to this moment in the video"
                        className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#e77e23] bg-[#e77e23]/10 border border-[#e77e23]/20 px-2 py-0.5 rounded-full mb-1.5 hover:bg-[#e77e23]/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[10px]">play_circle</span>
                        {fmtSeconds(note.timestamp)}
                      </button>
                    )}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {note.text}
                    </p>
                    <p className={`text-[11px] mt-1.5 ${muted}`}>{fmtDate(note.createdAt)}</p>
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
