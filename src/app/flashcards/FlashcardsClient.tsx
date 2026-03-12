"use client";

import { useState, useEffect } from "react";
import FlashcardModal from "@/components/course/FlashcardModal";
import Link from "next/link";

interface FlashcardSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  videoTitle: string;
  videoPosition: number;
  text: string;
  timestamp: number | null;
  reviewDue: string | null;
  reviewInterval: number;
}

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function FlashcardsClient() {
  const [cards, setCards] = useState<FlashcardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null); // courseId or "all"

  useEffect(() => {
    fetch("/api/flashcards")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCards(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by course
  const byCourse = new Map<string, { courseTitle: string; cards: FlashcardSummary[] }>();
  for (const card of cards) {
    if (!byCourse.has(card.courseId)) {
      byCourse.set(card.courseId, { courseTitle: card.courseTitle, cards: [] });
    }
    byCourse.get(card.courseId)!.cards.push(card);
  }

  const dueCount = cards.filter((c) => !c.reviewDue || new Date(c.reviewDue) <= new Date()).length;

  return (
    <>
      {reviewing && (
        <FlashcardModal
          courseId={reviewing === "all" ? undefined : reviewing}
          onClose={() => {
            setReviewing(null);
            // Refresh card list after review
            fetch("/api/flashcards")
              .then((r) => r.json())
              .then((data) => { if (Array.isArray(data)) setCards(data); })
              .catch(() => {});
          }}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-3xl animate-pulse mr-2">hourglass_empty</span>
          Loading…
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <span className="text-5xl">🃏</span>
          <h2 className="text-xl font-bold text-slate-900">No flashcards yet</h2>
          <p className="text-slate-500 max-w-sm text-sm">
            Open any course, write a note, and click the{" "}
            <span className="material-symbols-outlined text-sm align-middle text-purple-600">style</span>{" "}
            icon to mark it as a flashcard.
          </p>
          <Link href="/dashboard" className="mt-2 px-5 py-2 bg-[#e77e23] text-white rounded-xl text-sm font-semibold hover:bg-[#cf6f1f] transition-colors">
            Go to Dashboard
          </Link>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Summary banner */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-slate-900">{dueCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">cards due for review</p>
              <p className="text-xs text-slate-400 mt-1">{cards.length} total flashcards across {byCourse.size} course{byCourse.size !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setReviewing("all")}
              disabled={dueCount === 0}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Review All
            </button>
          </div>

          {/* Per-course cards */}
          {[...byCourse.entries()].map(([courseId, { courseTitle, cards: courseCards }]) => {
            const due = courseCards.filter((c) => !c.reviewDue || new Date(c.reviewDue) <= new Date()).length;
            return (
              <div key={courseId} className="bg-white rounded-2xl border border-orange-50 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-orange-50 bg-orange-50/30">
                  <div>
                    <h3 className="font-bold text-slate-900 truncate">{courseTitle}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {courseCards.length} card{courseCards.length !== 1 ? "s" : ""}
                      {due > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">{due} due</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setReviewing(courseId)}
                    disabled={due === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">style</span>
                    Review
                  </button>
                </div>

                <div className="divide-y divide-orange-50">
                  {courseCards.map((card) => {
                    const isDue = !card.reviewDue || new Date(card.reviewDue) <= new Date();
                    const preview = card.text.length > 80 ? card.text.slice(0, 80) + "…" : card.text;
                    return (
                      <div key={card.id} className="flex items-start gap-4 px-5 py-4">
                        <span className={`mt-0.5 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          isDue ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isDue ? "Due" : `In ${card.reviewInterval}d`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 mb-0.5">
                            {card.videoPosition + 1}. {card.videoTitle}
                            {card.timestamp != null && (
                              <span className="ml-1.5 text-[#e77e23] font-mono">@ {fmtSeconds(card.timestamp)}</span>
                            )}
                          </p>
                          <p className="text-sm text-slate-700 font-mono leading-relaxed">{preview}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
