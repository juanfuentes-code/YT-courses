import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractPlaylistId, fetchPlaylist } from "@/lib/youtube";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    include: {
      progress: {
        select: { videoId: true, watched: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const withProgress = courses.map((c) => {
    const total = c.progress.length;
    const watched = c.progress.filter((p) => p.watched).length;
    return {
      id: c.id,
      playlistId: c.playlistId,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      channelName: c.channelName,
      videoCount: c.videoCount,
      watchedCount: watched,
      progressPercent: total > 0 ? Math.round((watched / total) * 100) : 0,
      createdAt: c.createdAt,
    };
  });

  return NextResponse.json(withProgress);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    return NextResponse.json({ error: "Invalid YouTube playlist URL" }, { status: 400 });
  }

  // Check if already imported
  const existing = await prisma.course.findUnique({
    where: { userId_playlistId: { userId: session.user.id, playlistId } },
  });
  if (existing) return NextResponse.json({ error: "Course already imported" }, { status: 409 });

  // Fetch from YouTube API
  let playlist;
  try {
    playlist = await fetchPlaylist(playlistId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch playlist";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // Save course + all video progress rows
  const course = await prisma.course.create({
    data: {
      userId: session.user.id,
      playlistId,
      title: playlist.title,
      description: playlist.description,
      thumbnail: playlist.thumbnail,
      channelName: playlist.channelName,
      videoCount: playlist.videos.length,
      progress: {
        create: playlist.videos.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          position: v.position,
          watched: false,
        })),
      },
    },
  });

  return NextResponse.json({ id: course.id, title: course.title }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.course.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
