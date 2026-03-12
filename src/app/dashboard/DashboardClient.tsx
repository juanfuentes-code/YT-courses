"use client";

import { useState } from "react";
import Link from "next/link";
import CourseCard from "@/components/course/CourseCard";
import ImportCourseModal from "@/components/course/ImportCourseModal";

interface VideoProgress {
  videoId: string;
  title: string;
  thumbnail?: string | null;
  duration?: string | null;
  position: number;
}

interface Course {
  id: string;
  playlistId: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  channelName?: string | null;
  videoCount: number;
  watchedCount: number;
  progressPercent: number;
  nextUnwatched?: VideoProgress | null;
  createdAt: string;
}

export default function DashboardClient({
  courses,
  continueWatching,
  userName,
}: {
  courses: Course[];
  continueWatching: Course | null;
  userName: string;
}) {
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.channelName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalWatched = courses.reduce((s, c) => s + c.watchedCount, 0);
  const totalVideos = courses.reduce((s, c) => s + c.videoCount, 0);
  const overallPct = totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0;

  return (
    <>
      {showImport && <ImportCourseModal onClose={() => setShowImport(false)} />}

      {/* Top bar */}
      <header className="h-20 border-b border-orange-100 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e77e23] transition-colors">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-orange-50/50 border border-transparent rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#e77e23]/20 focus:border-[#e77e23] transition-all text-sm outline-none"
              placeholder="Search your courses..."
            />
          </div>
        </div>
        <div className="ml-8 flex items-center gap-3">
          <Link
            href="/flashcards"
            className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-purple-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">style</span>
            Flashcards
          </Link>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-[#e77e23] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#cf6f1f] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Import Course
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Stats row */}
        {courses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-orange-50 shadow-sm">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Courses</p>
              <p className="text-3xl font-black text-slate-900">{courses.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-orange-50 shadow-sm">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Videos watched</p>
              <p className="text-3xl font-black text-slate-900">{totalWatched}<span className="text-base text-slate-400 font-normal"> / {totalVideos}</span></p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-orange-50 shadow-sm">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Overall progress</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-black text-[#e77e23]">{overallPct}%</p>
                <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div className="bg-[#e77e23] h-full rounded-full" style={{ width: `${overallPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course grid header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black tracking-tight mb-1">Your Courses</h2>
          <p className="text-slate-500">
            {courses.length === 0
              ? "Import your first YouTube playlist to get started."
              : `${courses.length} course${courses.length !== 1 ? "s" : ""} imported from YouTube.`}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}

          {/* Import placeholder */}
          <button
            onClick={() => setShowImport(true)}
            className="border-2 border-dashed border-orange-200 rounded-xl flex flex-col items-center justify-center p-8 bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer group min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-[#e77e23] mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <p className="font-bold text-[#e77e23]">Import New Course</p>
            <p className="text-xs text-slate-500 mt-1">Paste a YouTube Playlist URL</p>
          </button>
        </div>

        {/* Continue Watching */}
        {continueWatching && continueWatching.nextUnwatched && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-6">Continue Watching</h3>
            <div className="bg-white rounded-xl p-4 border border-orange-50 flex flex-col md:flex-row gap-6 items-center shadow-sm">
              {/* Thumbnail */}
              <Link
                href={`/course/${continueWatching.id}?theater=true`}
                className="w-full md:w-64 aspect-video rounded-lg overflow-hidden relative flex-shrink-0 bg-slate-100 block group"
              >
                {continueWatching.nextUnwatched.thumbnail ? (
                  <img
                    src={continueWatching.nextUnwatched.thumbnail}
                    alt={continueWatching.nextUnwatched.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <span className="material-symbols-outlined text-slate-400 text-4xl">video_library</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <div className="w-12 h-12 bg-[#e77e23] rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </div>
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-orange-100 text-[#e77e23] text-[10px] font-bold rounded uppercase tracking-wider">
                    Lesson {continueWatching.nextUnwatched.position + 1}
                  </span>
                  <span className="text-xs text-slate-500">From: {continueWatching.title}</span>
                </div>
                <h4 className="text-xl font-bold mb-2 line-clamp-2">
                  {continueWatching.nextUnwatched.title}
                </h4>
                <div className="flex items-center justify-between gap-4 mt-4">
                  <div className="flex-1 bg-orange-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#e77e23] h-full rounded-full"
                      style={{ width: `${continueWatching.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap text-slate-600">
                    {continueWatching.watchedCount} / {continueWatching.videoCount} videos
                  </span>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/course/${continueWatching.id}?theater=true`}
                    className="inline-flex items-center gap-2 bg-[#e77e23] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#cf6f1f] transition-colors"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    Continue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {courses.length === 0 && (
          <div className="mt-16 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#e77e23] text-4xl">school</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Import a YouTube playlist to start tracking your learning progress.
            </p>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 bg-[#e77e23] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#cf6f1f] transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              Import your first course
            </button>
          </div>
        )}
      </div>
    </>
  );
}
