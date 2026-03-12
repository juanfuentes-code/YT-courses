import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/notes?courseId=&videoId=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const videoId = searchParams.get("videoId");

  if (!courseId || !videoId) {
    return NextResponse.json({ error: "courseId and videoId required" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id, courseId, videoId },
    orderBy: [{ timestamp: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(notes);
}

// POST /api/notes
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, videoId, text, timestamp } = await req.json();

  if (!courseId || !videoId || !text?.trim()) {
    return NextResponse.json({ error: "courseId, videoId and text required" }, { status: 400 });
  }

  // Verify ownership of the course
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: session.user.id },
  });
  if (!course) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      courseId,
      videoId,
      text: text.trim(),
      timestamp: typeof timestamp === "number" ? Math.floor(timestamp) : null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
