"use client";

import { useState, useCallback, useTransition, useRef, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import YouTubePlayer, { type YouTubePlayerHandle } from "@/components/course/YouTubePlayer";
import VideoNotes from "@/components/course/VideoNotes";
import FlashcardModal from "@/components/course/FlashcardModal";

interface Video {
  videoId: string;
  title: string;
  thumbnail?: string | null;
  duration?: string | null;
  position: number;
  watched: boolean;
  watchedAt?: string | null;
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
}

export default function CourseDetailClient({
  course,
  videos,
  currentVideo: initialVideo,
  theaterMode: initialTheater,
  userName,
  userImage,
}: {
  course: Course;
  videos: Video[];
  currentVideo: Video | null;
  theaterMode: boolean;
  userName: string;
  userImage: string | null;
}) {
  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [localVideos, setLocalVideos] = useState(videos);
  const [theaterMode, setTheaterMode] = useState(initialTheater);
  const [isPending, startTransition] = useTransition();
  const [showFlashcards, setShowFlashcards] = useState(false);
  const router = useRouter();
  const playerRef = useRef<YouTubePlayerHandle>(null);

  const watchedCount = localVideos.filter((v) => v.watched).length;
  const progressPercent = localVideos.length > 0
    ? Math.round((watchedCount / localVideos.length) * 100)
    : 0;

  const toggleWatched = useCallback(
    async (video: Video) => {
      const newWatched = !video.watched;
      // Optimistic update
      setLocalVideos((prev) =>
        prev.map((v) =>
          v.videoId === video.videoId ? { ...v, watched: newWatched } : v
        )
      );
      await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          videoId: video.videoId,
          watched: newWatched,
        }),
      });
      startTransition(() => router.refresh());
    },
    [course.id, router]
  );

  const ytUrl = currentVideo
    ? `https://www.youtube.com/watch?v=${currentVideo.videoId}&list=${course.playlistId}`
    : null;


  return (
    <>
      {showFlashcards && (
        <FlashcardModal courseId={course.id} onClose={() => setShowFlashcards(false)} />
      )}
      <CourseDetailInner
        course={course}
        videos={videos}
        currentVideo={currentVideo}
        theaterMode={theaterMode}
        userName={userName}
        userImage={userImage}
        localVideos={localVideos}
        watchedCount={watchedCount}
        progressPercent={progressPercent}
        theaterModeToggle={() => setTheaterMode((v) => !v)}
        toggleWatched={toggleWatched}
        setCurrentVideo={setCurrentVideo}
        playerRef={playerRef}
        onOpenFlashcards={() => setShowFlashcards(true)}
        ytUrl={ytUrl}
      />
    </>
  );
}

// Inner render component (avoids early return before hooks)
function CourseDetailInner({
  course,
  videos: _videos,
  currentVideo,
  theaterMode,
  userName: _userName,
  userImage,
  localVideos,
  watchedCount,
  progressPercent,
  theaterModeToggle,
  toggleWatched,
  setCurrentVideo,
  playerRef,
  onOpenFlashcards,
  ytUrl,
}: {
  course: { id: string; title: string; channelName?: string | null; playlistId: string; videoCount: number; watchedCount: number; progressPercent: number };
  videos: Video[];
  currentVideo: Video | null;
  theaterMode: boolean;
  userName: string;
  userImage: string | null;
  localVideos: Video[];
  watchedCount: number;
  progressPercent: number;
  theaterModeToggle: () => void;
  toggleWatched: (v: Video) => void;
  setCurrentVideo: (v: Video) => void;
  playerRef: RefObject<YouTubePlayerHandle | null>;
  onOpenFlashcards: () => void;
  ytUrl: string | null;
}) {
  // Theater mode — dark immersive layout
  if (theaterMode) {
    return (
      <div className="bg-[#211811] text-slate-100 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#211811] px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-[#e77e23] p-1.5 text-white">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
            <h2 className="text-base font-bold tracking-tight truncate max-w-xs">{course.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenFlashcards}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 text-sm transition-colors border border-purple-500/20"
            >
              <span className="material-symbols-outlined text-base">style</span>
              <span className="hidden sm:inline">Flashcards</span>
            </button>
            <button
              onClick={theaterModeToggle}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">view_agenda</span>
              <span className="hidden sm:inline">Normal view</span>
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white text-sm transition-colors border border-white/5">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </Link>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — lesson list */}
          <aside className="w-80 flex-col border-r border-white/10 bg-[#211811]/80 backdrop-blur-sm hidden md:flex">
            <div className="flex flex-col gap-4 p-5 h-full overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Course Curriculum
                  </h3>
                  <span className="text-[#e77e23] text-xs font-bold">{progressPercent}% Complete</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#e77e23]" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <nav className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {localVideos.map((v) => {
                  const isActive = v.videoId === currentVideo?.videoId;
                  return (
                    <button
                      key={v.videoId}
                      onClick={() => setCurrentVideo(v)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors w-full ${
                        isActive
                          ? "bg-[#e77e23]/15 border border-[#e77e23]/20"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-lg shrink-0 ${
                          v.watched
                            ? "text-green-400"
                            : isActive
                            ? "text-[#e77e23]"
                            : "text-slate-500"
                        }`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {v.watched ? "check_circle" : isActive ? "play_circle" : "radio_button_unchecked"}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-medium truncate ${isActive ? "text-white font-bold" : "text-slate-300"}`}>
                          {v.position + 1}. {v.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isActive ? "Current lesson" : v.duration ?? ""}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#211811]">
            {/* Video embed */}
            <section className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
              {currentVideo ? (
                <YouTubePlayer
                  ref={playerRef}
                  key={currentVideo.videoId}
                  videoId={currentVideo.videoId}
                  playlistId={course.playlistId}
                  title={currentVideo.title}
                  dark={true}
                  onEnd={() => toggleWatched(currentVideo)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-6xl">video_library</span>
                </div>
              )}
            </section>

            {/* Info section */}
            {currentVideo && (
              <section className="p-8 max-w-5xl mx-auto w-full">
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-[#e77e23] text-[10px] font-bold text-white uppercase tracking-widest">
                          {currentVideo.watched ? "Completed" : "Ongoing"}
                        </span>
                        <span className="text-[#e77e23] text-sm font-semibold tracking-wide">
                          Lesson {currentVideo.position + 1}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight">
                        {currentVideo.title}
                      </h1>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => toggleWatched(currentVideo)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                          currentVideo.watched
                            ? "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                            : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {currentVideo.watched ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        {currentVideo.watched ? "Watched" : "Mark watched"}
                      </button>
                      {ytUrl && (
                        <a
                          href={ytUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl px-4 py-2 bg-[#2d241d] border border-white/5 text-slate-300 hover:text-white text-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-500 border border-white/5">
                      {course.channelName}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-500 border border-white/5">
                      Lesson {currentVideo.position + 1} of {localVideos.length}
                    </span>
                    {currentVideo.duration && (
                      <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-500 border border-white/5">
                        {currentVideo.duration}
                      </span>
                    )}
                  </div>

                  {/* Next / Prev */}
                  <div className="flex gap-3 pt-2">
                    {currentVideo.position > 0 && (
                      <button
                        onClick={() => {
                          const prev = localVideos.find((v) => v.position === currentVideo.position - 1);
                          if (prev) setCurrentVideo(prev);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-slate-300 hover:text-white text-sm border border-white/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">skip_previous</span>
                        Previous
                      </button>
                    )}
                    {currentVideo.position < localVideos.length - 1 && (
                      <button
                        onClick={() => {
                          toggleWatched(currentVideo);
                          const next = localVideos.find((v) => v.position === currentVideo.position + 1);
                          if (next) setCurrentVideo(next);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#e77e23] rounded-xl text-white font-semibold text-sm hover:bg-[#cf6f1f] transition-colors"
                      >
                        Next lesson
                        <span className="material-symbols-outlined text-base">skip_next</span>
                      </button>
                    )}
                  </div>

                  {/* Notes — theater mode */}
                  <VideoNotes
                    courseId={course.id}
                    videoId={currentVideo.videoId}
                    dark={true}
                    getCurrentTime={() => playerRef.current?.getCurrentTime() ?? 0}
                    seekTo={(s) => playerRef.current?.seekTo(s)}
                    onOpenFlashcards={onOpenFlashcards}
                  />
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Normal / light mode layout
  return (
    <div className="bg-[#f8f7f6] min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-orange-100 bg-[#f8f7f6]/80 backdrop-blur-md px-6 md:px-10 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#e77e23]">school</span>
            </div>
            <h2 className="text-slate-900 text-lg font-bold tracking-tight">TubeCourse</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFlashcards}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 hover:text-purple-800 bg-purple-50 border border-purple-200 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-base">style</span>
            <span className="hidden sm:inline">Flashcards</span>
          </button>
          <button
            onClick={theaterModeToggle}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#e77e23] bg-white border border-slate-200 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-base">theaters</span>
            <span className="hidden sm:inline">Theater Mode</span>
          </button>
          {userImage ? (
            <img src={userImage} className="w-9 h-9 rounded-full border-2 border-orange-200" alt="" />
          ) : null}
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-screen-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard" className="text-slate-500 text-sm hover:text-[#e77e23] transition-colors">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <span className="text-slate-900 text-sm font-semibold truncate max-w-xs">{course.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Video + stats */}
          <div className="lg:col-span-8 space-y-8">
            {/* Video player */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: "16/9" }}>
              {currentVideo ? (
                <YouTubePlayer
                  ref={playerRef}
                  key={currentVideo.videoId}
                  videoId={currentVideo.videoId}
                  playlistId={course.playlistId}
                  title={currentVideo.title}
                  dark={false}
                  onEnd={() => toggleWatched(currentVideo)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl">video_library</span>
                    <p className="mt-2">No video selected</p>
                  </div>
                </div>
              )}
            </div>

            {/* Current video info */}
            {currentVideo && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {currentVideo.position + 1}. {currentVideo.title}
                  </h1>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleWatched(currentVideo)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        currentVideo.watched
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-orange-50 hover:text-[#e77e23]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {currentVideo.watched ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      {currentVideo.watched ? "Watched" : "Mark watched"}
                    </button>
                    {ytUrl && (
                      <a
                        href={ytUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-[#e77e23] text-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                        Open in YouTube
                      </a>
                    )}
                  </div>
                </div>

                {/* Next/Prev navigation */}
                <div className="flex gap-3">
                  {currentVideo.position > 0 && (
                    <button
                      onClick={() => {
                        const prev = localVideos.find((v) => v.position === currentVideo.position - 1);
                        if (prev) setCurrentVideo(prev);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm hover:border-[#e77e23] hover:text-[#e77e23] transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">skip_previous</span>
                      Previous
                    </button>
                  )}
                  {currentVideo.position < localVideos.length - 1 && (
                    <button
                      onClick={() => {
                        if (!currentVideo.watched) toggleWatched(currentVideo);
                        const next = localVideos.find((v) => v.position === currentVideo.position + 1);
                        if (next) setCurrentVideo(next);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#e77e23] text-white rounded-xl font-semibold text-sm hover:bg-[#cf6f1f] transition-colors"
                    >
                      Next lesson
                      <span className="material-symbols-outlined text-base">skip_next</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-orange-50 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#e77e23]">video_library</span>
                  <span className="text-sm font-medium text-slate-500">Total Videos</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{course.videoCount}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-orange-50 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#e77e23]">analytics</span>
                  <span className="text-sm font-medium text-slate-500">Completed</span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold text-slate-900">{progressPercent}%</p>
                  <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div className="bg-[#e77e23] h-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-orange-50 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#e77e23]">check_circle</span>
                  <span className="text-sm font-medium text-slate-500">Watched</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {watchedCount}
                  <span className="text-base text-slate-400 font-normal"> / {localVideos.length}</span>
                </p>
              </div>
            </div>

            {/* Notes — normal mode */}
            {currentVideo && (
              <VideoNotes
                courseId={course.id}
                videoId={currentVideo.videoId}
                dark={false}
                getCurrentTime={() => playerRef.current?.getCurrentTime() ?? 0}
                seekTo={(s) => playerRef.current?.seekTo(s)}
                onOpenFlashcards={onOpenFlashcards}
              />
            )}
          </div>

          {/* Right: Lesson list */}
          <div className="lg:col-span-4 flex flex-col bg-white rounded-xl border border-orange-50 overflow-hidden shadow-lg min-h-[500px]">
            <div className="p-5 border-b border-orange-50 bg-orange-50/50">
              <h3 className="text-lg font-bold text-slate-900">Course Content</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-slate-500">
                  {watchedCount} of {localVideos.length} lessons completed
                </p>
                <span className="text-xs font-bold text-[#e77e23] px-2 py-1 bg-orange-100 rounded-full">
                  {progressPercent}% DONE
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {localVideos.map((v) => {
                const isActive = v.videoId === currentVideo?.videoId;
                return (
                  <div
                    key={v.videoId}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group ${
                      isActive
                        ? "bg-orange-50 border border-orange-100"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setCurrentVideo(v)}
                  >
                    {/* Status icon */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatched(v); }}
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    >
                      {v.watched ? (
                        <span className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-green-600 text-lg">check</span>
                        </span>
                      ) : isActive ? (
                        <span className="w-9 h-9 rounded-full bg-[#e77e23] flex items-center justify-center shadow-md shadow-orange-200">
                          <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </span>
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-orange-50">
                          <span className="material-symbols-outlined text-slate-400 text-lg">radio_button_unchecked</span>
                        </span>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? "text-[#e77e23]" : "text-slate-900"}`}>
                        {v.position + 1}. {v.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {v.duration ?? ""}
                        {v.watched ? " • Completed" : isActive ? " • Current" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-orange-50">
              <a
                href={`https://www.youtube.com/playlist?list=${course.playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#e77e23] hover:bg-[#cf6f1f] text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                Open Full Playlist on YouTube
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
