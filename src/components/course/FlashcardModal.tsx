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
  courseId?: string; // if provided, filters to one course
  onClose: () => void;
}

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function FlashcardModal({ courseId, onClose }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    const url = courseId
      ? `/api/flashcards?courseId=${courseId}`
      : `/api/flashcards`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId]);

  const handleReview = useCallback(
    async (result: "again" | "good" | "easy") => {
      const card = cards[current];
      if (!card) return;

      await fetch(`/api/notes/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewResult: result,
          currentInterval: card.reviewInterval,
        }),
      });

      setReviewed((r) => r + 1);
      setFlipped(false);

      if (current + 1 >= cards.length) {
        setDone(true);
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [cards, current]
  );

  // Keyboard shortcuts
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

  // Detect Q/A split
  function parseFrontBack(text: string): { front: string; back: string } {
    const sep = text.indexOf("\n---\n");
    if (sep !== -1) {
      return { front: text.slice(0, sep).trim(), back: text.slice(sep + 5).trim() };
    }
    return { front: "", back: text };
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a1310] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#e77e23]">style</span>
            <h2 className="font-bold text-white text-base">Flashcards</h2>
            {!loading && !done && (
              <span className="text-xs text-slate-400">
                {current + 1} / {cards.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Progress bar */}
        {!loading && cards.length > 0 && (
          <div className="h-1 bg-white/5">
            <div
              className="h-full bg-[#e77e23] transition-all"
              style={{ width: `${Math.round(((done ? cards.length : current) / cards.length) * 100)}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col items-center justify-center p-8 min-h-[320px] gap-6">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <span className="material-symbols-outlined text-3xl animate-pulse">hourglass_empty</span>
              <p className="text-sm">Loading flashcards…</p>
            </div>
          )}

          {!loading && cards.length === 0 && (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-4xl">🃏</span>
              <p className="text-white font-semibold">No flashcards due!</p>
              <p className="text-slate-400 text-sm">
                Mark notes as flashcards using the{" "}
                <span className="material-symbols-outlined text-sm align-middle">style</span> icon.
              </p>
              <button onClick={onClose} className="mt-2 px-4 py-2 bg-[#e77e23] text-white rounded-xl text-sm font-semibold hover:bg-[#cf6f1f] transition-colors">
                Got it
              </button>
            </div>
          )}

          {!loading && done && (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-4xl">🎉</span>
              <p className="text-white font-bold text-lg">Session complete!</p>
              <p className="text-slate-400 text-sm">You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}.</p>
              <button onClick={onClose} className="mt-2 px-5 py-2 bg-[#e77e23] text-white rounded-xl text-sm font-semibold hover:bg-[#cf6f1f] transition-colors">
                Close
              </button>
            </div>
          )}

          {!loading && !done && card && (() => {
            const { front, back } = parseFrontBack(card.text);
            const hasSplit = front !== "";
            return (
              <>
                {/* Context */}
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-xs text-slate-500">{card.courseTitle}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {card.videoPosition + 1}. {card.videoTitle}
                    {card.timestamp != null && (
                      <span className="ml-2 text-[#e77e23] font-mono">@ {fmtSeconds(card.timestamp)}</span>
                    )}
                  </p>
                </div>

                {/* Card face */}
                <div
                  className={`w-full rounded-2xl border p-6 cursor-pointer select-none transition-all ${
                    flipped
                      ? "border-[#e77e23]/30 bg-[#2d1e10]"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                  onClick={() => setFlipped(true)}
                >
                  {!flipped ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      {hasSplit ? (
                        <div className="text-white text-base font-medium leading-relaxed">
                          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                            {front}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-[#e77e23] text-3xl">quiz</span>
                          <p className="text-slate-300 text-sm">What did you note here?</p>
                          <p className="text-slate-500 text-xs">Click or press Space to reveal</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {back}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {flipped ? (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleReview("again")}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                      <span className="text-base">😓</span>
                      <span>Again</span>
                      <span className="text-[10px] opacity-60">1</span>
                    </button>
                    <button
                      onClick={() => handleReview("good")}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-[#e77e23]/30 bg-[#e77e23]/10 text-[#e77e23] hover:bg-[#e77e23]/20 transition-colors text-sm font-medium"
                    >
                      <span className="text-base">😊</span>
                      <span>Good</span>
                      <span className="text-[10px] opacity-60">2</span>
                    </button>
                    <button
                      onClick={() => handleReview("easy")}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
                    >
                      <span className="text-base">🎯</span>
                      <span>Easy</span>
                      <span className="text-[10px] opacity-60">3</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setFlipped(true)}
                    className="px-8 py-3 bg-[#e77e23] text-white rounded-xl font-semibold hover:bg-[#cf6f1f] transition-colors text-sm"
                  >
                    Show answer <span className="opacity-60 ml-1 text-xs">Space</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>

        {/* Footer hint */}
        {!loading && !done && card && (
          <div className="px-6 py-3 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-600">
              Tip: write notes with <code className="bg-white/5 px-1 rounded">front\n---\nback</code> for custom Q&A cards
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
