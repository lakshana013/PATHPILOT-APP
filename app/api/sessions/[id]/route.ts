import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      student: { include: { studentProfile: true } },
      professional: { include: { professionalProfile: true } },
    },
  });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const isParticipant =
    s.studentId === session.user.id || s.professionalId === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(s);
}
