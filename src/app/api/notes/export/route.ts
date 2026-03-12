import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Format seconds → "1:23:45" or "23:45" */
function fmtSec(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// GET /api/notes/export?courseId=X
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  // Verify ownership
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: session.user.id },
  });
  if (!course) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all videos (for titles) and notes together
  const [videos, notes] = await Promise.all([
    prisma.videoProgress.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: { videoId: true, title: true, position: true },
    }),
    prisma.note.findMany({
      where: { courseId, userId: session.user.id },
      orderBy: [{ videoId: "asc" }, { timestamp: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const videoMap = new Map(videos.map((v) => [v.videoId, v]));

  // Group notes by videoId
  const grouped = new Map<string, typeof notes>();
  for (const note of notes) {
    if (!grouped.has(note.videoId)) grouped.set(note.videoId, []);
    grouped.get(note.videoId)!.push(note);
  }

  const now = new Date().toISOString().split("T")[0];

  // Build Obsidian-friendly markdown
  let md = `---
title: "${course.title.replace(/"/g, '\\"')}"
course: "${course.title.replace(/"/g, '\\"')}"
channel: "${(course.channelName ?? "").replace(/"/g, '\\"')}"
exported: ${now}
tags: [tubecourse, notes]
---

# ${course.title}

> **Channel:** ${course.channelName ?? "Unknown"}
> **Exported:** ${now}
> **Total notes:** ${notes.length}

`;

  // Sort video entries by position
  const sortedVideos = [...grouped.keys()].sort((a, b) => {
    const posA = videoMap.get(a)?.position ?? 999;
    const posB = videoMap.get(b)?.position ?? 999;
    return posA - posB;
  });

  for (const videoId of sortedVideos) {
    const video = videoMap.get(videoId);
    const videoNotes = grouped.get(videoId)!;
    const videoTitle = video ? `${video.position + 1}. ${video.title}` : `Video (${videoId})`;
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

    md += `## ${videoTitle}\n\n`;
    md += `[▶ Watch on YouTube](${ytUrl})\n\n`;

    for (const note of videoNotes) {
      const tsLabel = note.timestamp != null
        ? `**[${fmtSec(note.timestamp)}](${ytUrl}&t=${note.timestamp})** `
        : "";
      const flashcardLabel = note.isFlashcard ? " 🃏" : "";
      md += `- ${tsLabel}${note.text}${flashcardLabel}\n`;
    }

    md += "\n";
  }

  const slug = course.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `tubecourse-${slug}-${now}.md`;

  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
