import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CourseDetailClient from "./CourseDetailClient";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ video?: string; theater?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const { video: videoIdParam, theater } = await searchParams;

  const course = await prisma.course.findFirst({
    where: { id, userId: session.user.id },
    include: { progress: { orderBy: { position: "asc" } } },
  });

  if (!course) notFound();

  const watched = course.progress.filter((p) => p.watched).length;
  const total = course.progress.length;
  const progressPercent = total > 0 ? Math.round((watched / total) * 100) : 0;

  // Default to first unwatched, or first video
  const defaultVideo =
    (videoIdParam
      ? course.progress.find((p) => p.videoId === videoIdParam)
      : null) ??
    course.progress.find((p) => !p.watched) ??
    course.progress[0] ??
    null;

  return (
    <CourseDetailClient
      course={{
        id: course.id,
        playlistId: course.playlistId,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        channelName: course.channelName,
        videoCount: total,
        watchedCount: watched,
        progressPercent,
      }}
      videos={course.progress.map((p) => ({
        videoId: p.videoId,
        title: p.title,
        thumbnail: p.thumbnail,
        duration: p.duration,
        position: p.position,
        watched: p.watched,
        watchedAt: p.watchedAt?.toISOString() ?? null,
      }))}
      currentVideo={defaultVideo ? {
        videoId: defaultVideo.videoId,
        title: defaultVideo.title,
        thumbnail: defaultVideo.thumbnail,
        duration: defaultVideo.duration,
        position: defaultVideo.position,
        watched: defaultVideo.watched,
      } : null}
      theaterMode={theater === "true"}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? null}
    />
  );
}
