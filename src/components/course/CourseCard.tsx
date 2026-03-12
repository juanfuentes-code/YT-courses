"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  thumbnail?: string | null;
  channelName?: string | null;
  videoCount: number;
  watchedCount: number;
  progressPercent: number;
}

export default function CourseCard({ course }: { course: Course }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Remove "${course.title}"?`)) return;
    setDeleting(true);
    await fetch("/api/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id }),
    });
    router.refresh();
  }

  return (
    <Link href={`/course/${course.id}`} className="block">
      <div className="bg-white rounded-xl overflow-hidden border border-orange-50 shadow-sm hover:shadow-md transition-shadow group relative">
        {/* Thumbnail */}
        <div className="aspect-video relative overflow-hidden bg-slate-100">
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#e77e23]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_circle
            </span>
          </div>
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-300 text-5xl">video_library</span>
            </div>
          )}
          {/* Video count badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {course.videoCount} videos
          </div>
          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-full p-1 hover:bg-red-500 z-20"
            title="Remove course"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1 text-slate-900">{course.title}</h3>
          <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">video_library</span>
            {course.channelName ?? "YouTube"}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Progress</span>
              <span className="text-[#e77e23]">{course.progressPercent}%</span>
            </div>
            <div className="w-full bg-orange-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#e77e23] h-full rounded-full transition-all duration-500"
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {course.watchedCount} / {course.videoCount} videos watched
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
