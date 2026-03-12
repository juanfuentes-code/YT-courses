import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const course = await prisma.course.findFirst({
    where: { id, userId: session.user.id },
    include: {
      progress: { orderBy: { position: "asc" } },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const watched = course.progress.filter((p) => p.watched).length;
  const total = course.progress.length;

  return NextResponse.json({
    ...course,
    watchedCount: watched,
    progressPercent: total > 0 ? Math.round((watched / total) * 100) : 0,
  });
}
