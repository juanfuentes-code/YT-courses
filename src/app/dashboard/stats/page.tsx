import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    include: { progress: true },
    orderBy: { createdAt: "desc" },
  });

  const totalVideos = courses.reduce((s, c) => s + c.progress.length, 0);
  const totalWatched = courses.reduce((s, c) => s + c.progress.filter((p) => p.watched).length, 0);
  const overallPct = totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-1">Statistics</h2>
        <p className="text-slate-500">Your learning progress at a glance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Courses", value: courses.length, icon: "school" },
          { label: "Total videos", value: totalVideos, icon: "video_library" },
          { label: "Watched", value: totalWatched, icon: "check_circle" },
          { label: "Overall", value: `${overallPct}%`, icon: "analytics" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-orange-50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#e77e23]">{stat.icon}</span>
              <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-course breakdown */}
      <h3 className="text-xl font-bold mb-4">Per-course breakdown</h3>
      <div className="flex flex-col gap-4">
        {courses.map((c) => {
          const total = c.progress.length;
          const watched = c.progress.filter((p) => p.watched).length;
          const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
          return (
            <div key={c.id} className="bg-white rounded-xl p-5 border border-orange-50 shadow-sm flex items-center gap-6">
              {c.thumbnail && (
                <img
                  src={c.thumbnail}
                  alt={c.title}
                  className="w-16 h-10 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                <p className="text-xs text-slate-500">{c.channelName}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div className="bg-[#e77e23] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#e77e23] w-10 text-right">{pct}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{watched} / {total} videos</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
