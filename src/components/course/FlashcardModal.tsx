"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface Flashcard {
  id: string;
  text: string;
  timestamp: number | null;
  reviewInterval: number;
  reviewDue: string | null;
  courseTitle: string;
  videoTitle: string;
  videoPosition: number;
  videoId: string;
  courseId: string;
}

interface Props {
  courseId?: string;
  onClose: () => void;
}

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * Split a note into front/back halves.
 * Supports a line that is exactly "---" (any whitespace around it),
 * whether separated by actual newlines OR literal \n in the stored text.
 */
function parseFrontBack(raw: string): { front: string; back: string } {
  // Normalise literal \n escape sequences so users can type either style
  const text = raw.replace(/\\n/g, "\n");
  const lines = text.split("\n");
  const sepIdx = lines.findIndex((l) => l.trim() === "---");
  if (sepIdx > 0) {
    const front = lines.slice(0, sepIdx).join("\n").trim();
    const back = lines.slice(sepIdx + 1).join("\n").trim();
    if (front && back) return { front, back };
  }
  return { front: "", back: text };
}

export default function FlashcardModal({ courseId, onClose }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    const url = courseId ? `/api/flashcards?courseId=${courseId}` : `/api/flashcards`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCards(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleReview = useCallback(
    async (result: "again" | "good" | "easy") => {
      const card = cards[current];
      if (!card) return;

      await fetch(`/api/notes/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewResult: result, currentInterval: card.reviewInterval }),
      });

      setReviewed((r) => r + 1);
      setFlipped(false);
      if (current + 1 >= cards.length) setDone(true);
      else setCurrent((c) => c + 1);
    },
    [cards, current]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (!flipped) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(true); }
      } else {
        if (e.key === "1") handleReview("again");
        if (e.key === "2") handleReview("good");
        if (e.key === "3") handleReview("easy");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, handleReview, onClose]);

  const card = cards[current];
  const progress = cards.length > 0
    ? Math.round(((done ? cards.length : current) / cards.length) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl shadow-orange-900/10 flex flex-col overflow-hidden border border-orange-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-orange-50/60">
          <div className="flex items-center gap-2">
            <div className="size-7 bg-[#e77e23] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">style</span>
            </div>
            <h2 className="font-bold text-slate-900 text-base">Flashcards</h2>
            {!loading && !done && cards.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {current + 1} / {cards.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Progress bar */}
        {!loading && cards.length > 0 && (
          <div className="h-1 bg-orange-100">
            <div
              className="h-full bg-[#e77e23] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col items-center p-6 gap-5 min-h-[360px]">

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-3xl animate-pulse">hourglass_empty</span>
              <p className="text-sm">Loading flashcards…</p>
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && cards.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
              <span className="text-4xl">🃏</span>
              <div>
                <p className="text-slate-900 font-bold text-lg">No flashcards due!</p>
                <p className="text-slate-500 text-sm mt-1">
                  Mark notes as flashcards with the{" "}
                  <span className="material-symbols-outlined text-sm align-middle text-purple-600">style</span>{" "}
                  icon in your notes.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#e77e23] text-white rounded-xl text-sm font-semibold hover:bg-[#cf6f1f] transition-colors"
              >
                Got it
              </button>
            </div>
          )}

          {/* ── Done ── */}
          {!loading && done && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
              <span className="text-5xl">🎉</span>
              <div>
                <p className="text-slate-900 font-bold text-xl">Session complete!</p>
                <p className="text-slate-500 text-sm mt-1">
                  You reviewed <span className="font-semibold text-slate-700">{reviewed}</span> card{reviewed !== 1 ? "s" : ""}.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#e77e23] text-white rounded-xl text-sm font-semibold hover:bg-[#cf6f1f] transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ── Active card ── */}
          {!loading && !done && card && (() => {
            const { front, back } = parseFrontBack(card.text);
            const hasSplit = front !== "";

            return (
              <div className="w-full flex flex-col gap-4">

                {/* Context label */}
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <p className="text-[11px] text-slate-400 truncate max-w-full">{card.courseTitle}</p>
                  <p className="text-xs text-slate-600 font-medium">
                    {card.videoPosition + 1}. {card.videoTitle}
                    {card.timestamp != null && (
                      <span className="ml-1.5 font-mono text-[#e77e23]">@ {fmtSeconds(card.timestamp)}</span>
                    )}
                  </p>
                </div>

                {/* ── Flip card ── */}
                <div style={{ perspective: "1200px" }} className="w-full">
                  <div
                    style={{
                      transformStyle: "preserve-3d",
                      transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      position: "relative",
                      minHeight: "160px",
                    }}
                  >
                    {/* FRONT */}
                    <div
                      style={{ backfaceVisibility: "hidden" }}
                      onClick={() => !flipped && setFlipped(true)}
                      className={`absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${
                        !flipped
                          ? "border-orange-200 bg-orange-50/60 hover:bg-orange-50"
                          : "border-orange-100 bg-orange-50/30"
                      }`}
                    >
                      {hasSplit ? (
                        <div className="prose prose-sm max-w-none text-center w-full text-slate-800">
                          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{front}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center select-none">
                          <span className="material-symbols-outlined text-[#e77e23] text-4xl">quiz</span>
                          <p className="text-slate-700 font-semibold">What did you note here?</p>
                          <p className="text-slate-400 text-xs">Click or press Space to reveal</p>
                        </div>
                      )}
                    </div>

                    {/* BACK */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                      className="absolute inset-0 rounded-2xl border-2 border-[#e77e23]/40 bg-[#fff8f2] flex flex-col justify-center p-6 overflow-y-auto"
                    >
                      <div className="prose prose-sm max-w-none text-slate-800">
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{back}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  {/* Spacer so content below doesn't overlap the absolute-positioned card faces */}
                  <div style={{ minHeight: "160px" }} aria-hidden="true" />
                </div>

                {/* ── Actions ── */}
                {flipped ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleReview("again")}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-semibold"
                    >
                      <span className="text-lg">😓</span>
                      <span>Again</span>
                      <kbd className="text-[9px] opacity-50 font-mono">1</kbd>
                    </button>
                    <button
                      onClick={() => handleReview("good")}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-orange-200 bg-orange-50 text-[#e77e23] hover:bg-orange-100 transition-colors text-sm font-semibold"
                    >
                      <span className="text-lg">😊</span>
                      <span>Good</span>
                      <kbd className="text-[9px] opacity-50 font-mono">2</kbd>
                    </button>
                    <button
                      onClick={() => handleReview("easy")}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-semibold"
                    >
                      <span className="text-lg">🎯</span>
                      <span>Easy</span>
                      <kbd className="text-[9px] opacity-50 font-mono">3</kbd>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setFlipped(true)}
                    className="w-full py-3 bg-[#e77e23] text-white rounded-xl font-semibold hover:bg-[#cf6f1f] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Show answer
                    <kbd className="ml-1 text-[11px] opacity-70 font-mono bg-white/20 px-1.5 py-0.5 rounded">Space</kbd>
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer tip */}
        {!loading && !done && card && (
          <div className="px-6 py-3 border-t border-orange-100 bg-orange-50/40 text-center">
            <p className="text-[11px] text-slate-400">
              Tip: separate front and back with a <code className="bg-orange-100 text-orange-700 px-1 rounded font-mono">---</code> line in your note
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
