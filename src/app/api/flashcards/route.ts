import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/flashcards?courseId=X (optional filter)
// Returns flashcards due for review (reviewDue <= now OR reviewDue is null)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId") ?? undefined;

  const now = new Date();

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      isFlashcard: true,
      ...(courseId ? { courseId } : {}),
      OR: [
        { reviewDue: null },
        { reviewDue: { lte: now } },
      ],
    },
    orderBy: [{ reviewDue: "asc" }, { createdAt: "asc" }],
  });

  // Enrich with course + video title
  const courseIds = [...new Set(notes.map((n) => n.courseId))];
  const videoIds = [...new Set(notes.map((n) => n.videoId))];

  const [courses, videos] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: courseIds }, userId: session.user.id },
      select: { id: true, title: true },
    }),
    prisma.videoProgress.findMany({
      where: { videoId: { in: videoIds }, courseId: { in: courseIds } },
      select: { videoId: true, courseId: true, title: true, position: true },
    }),
  ]);

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const videoMap = new Map(videos.map((v) => [`${v.courseId}:${v.videoId}`, v]));

  const enriched = notes.map((n) => ({
    ...n,
    courseTitle: courseMap.get(n.courseId)?.title ?? "Unknown Course",
    videoTitle: videoMap.get(`${n.courseId}:${n.videoId}`)?.title ?? "Unknown Video",
    videoPosition: videoMap.get(`${n.courseId}:${n.videoId}`)?.position ?? 0,
  }));

  return NextResponse.json(enriched);
}
