import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/progress — toggle watched state for a video
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, videoId, watched } = await req.json();
  if (!courseId || !videoId) {
    return NextResponse.json({ error: "courseId and videoId required" }, { status: 400 });
  }

  // Verify ownership
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: session.user.id },
  });
  if (!course) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const progress = await prisma.videoProgress.updateMany({
    where: { courseId, videoId },
    data: {
      watched: Boolean(watched),
      watchedAt: watched ? new Date() : null,
    },
  });

  return NextResponse.json({ updated: progress.count });
}

// POST /api/progress/mark-all — mark all videos as watched/unwatched
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, watched } = await req.json();

  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: session.user.id },
  });
  if (!course) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.videoProgress.updateMany({
    where: { courseId },
    data: { watched: Boolean(watched), watchedAt: watched ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
