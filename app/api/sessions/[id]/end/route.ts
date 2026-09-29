import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionMessages } from "@/lib/chat-messages";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const isParticipant = s.studentId === session.user.id || s.professionalId === session.user.id;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (s.status === "ended") return NextResponse.json({ ok: true });
  await prisma.session.update({
    where: { id },
    data: { status: "ended", endedAt: new Date() },
  });
  clearSessionMessages(id);
  return NextResponse.json({ ok: true });
}
