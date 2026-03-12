"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ImportCourseModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleImport() {
    setError("");
    if (!url.trim()) { setError("Please enter a URL"); return; }

    startTransition(async () => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to import course");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Import YouTube Course</h2>
            <p className="text-sm text-slate-500 mt-1">Paste a YouTube playlist URL below</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            YouTube Playlist URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            placeholder="https://www.youtube.com/playlist?list=PL..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77e23]/40 focus:border-[#e77e23] transition-all"
          />
          {error && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}
        </div>

        <div className="bg-orange-50 rounded-xl p-4 text-sm text-slate-600">
          <p className="font-medium text-[#e77e23] mb-1">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            How to get the URL
          </p>
          <ol className="list-decimal ml-4 space-y-1 text-slate-500">
            <li>Go to any YouTube playlist</li>
            <li>Copy the URL from your browser (must contain <code className="bg-white px-1 rounded">?list=</code>)</li>
            <li>Paste it here</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-[#e77e23] text-white font-semibold hover:bg-[#cf6f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Importing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">download</span>
                Import Course
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
