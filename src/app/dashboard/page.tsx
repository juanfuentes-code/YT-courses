import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const rawCourses = await prisma.course.findMany({
    where: { userId: session.user.id },
    include: { progress: { select: { videoId: true, watched: true, watchedAt: true, position: true, title: true, thumbnail: true, duration: true } } },
    orderBy: { createdAt: "desc" },
  });

  const courses = rawCourses.map((c) => {
    const total = c.progress.length;
    const watched = c.progress.filter((p) => p.watched).length;
    // Find last watched video
    const lastWatched = c.progress
      .filter((p) => p.watchedAt)
      .sort((a, b) => (b.watchedAt?.getTime() ?? 0) - (a.watchedAt?.getTime() ?? 0))[0];
    // Next unwatched
    const nextUnwatched = c.progress
      .filter((p) => !p.watched)
      .sort((a, b) => a.position - b.position)[0];

    return {
      id: c.id,
      playlistId: c.playlistId,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      channelName: c.channelName,
      videoCount: total,
      watchedCount: watched,
      progressPercent: total > 0 ? Math.round((watched / total) * 100) : 0,
      lastWatched: lastWatched ?? null,
      nextUnwatched: nextUnwatched ?? null,
      createdAt: c.createdAt.toISOString(),
    };
  });

  // Find "continue watching" — most recently active course with unwatched videos
  const continueWatching = courses.find(
    (c) => c.progressPercent > 0 && c.progressPercent < 100 && c.nextUnwatched
  ) ?? null;

  return (
    <DashboardClient
      courses={courses}
      continueWatching={continueWatching}
      userName={session.user.name ?? ""}
    />
  );
}
