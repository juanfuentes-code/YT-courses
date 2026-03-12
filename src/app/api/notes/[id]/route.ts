import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/notes/[id] — edit note text, flashcard state, or review result
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.text !== undefined) {
    if (!body.text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
    data.text = body.text.trim();
  }

  if (body.isFlashcard !== undefined) {
    data.isFlashcard = Boolean(body.isFlashcard);
    // When toggling on, set first review to now
    if (data.isFlashcard) {
      data.reviewDue = data.reviewDue ?? new Date();
      data.reviewInterval = 1;
    }
  }

  // Review result: "again" | "good" | "easy"
  if (body.reviewResult !== undefined) {
    const now = new Date();
    const currentInterval = body.currentInterval ?? 1;
    let nextInterval = currentInterval;
    if (body.reviewResult === "again") nextInterval = 1;
    else if (body.reviewResult === "good") nextInterval = Math.ceil(currentInterval * 2);
    else if (body.reviewResult === "easy") nextInterval = Math.ceil(currentInterval * 4);

    const due = new Date(now);
    due.setDate(due.getDate() + nextInterval);
    data.reviewDue = due;
    data.reviewInterval = nextInterval;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.note.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/notes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.note.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
