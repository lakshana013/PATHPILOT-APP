import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "student" && session.user.role !== "professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionRecord = await prisma.session.findUnique({
    where: { id },
  });
  if (!sessionRecord) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isStudent = sessionRecord.studentId === session.user.id;
  const isProfessional = sessionRecord.professionalId === session.user.id;
  if (!isStudent && !isProfessional) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sessionRecord.status === "ended") {
    return NextResponse.json({ error: "Session ended" }, { status: 400 });
  }

  if (sessionRecord.status === "active") {
    return NextResponse.json({ ok: true, status: "active" });
  }

  if (session.user.role === "professional") {
    if (!isProfessional) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (sessionRecord.status === "requested") {
      await prisma.session.update({
        where: { id },
        data: { status: "accepted" },
      });
      return NextResponse.json({ ok: true, status: "accepted" });
    }
    if (sessionRecord.status === "accepted") {
      return NextResponse.json({ ok: true, status: "accepted" });
    }
    return NextResponse.json({ error: "Session cannot be accepted" }, { status: 400 });
  }

  if (!isStudent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (sessionRecord.status === "requested") {
    return NextResponse.json(
      { error: "Waiting for teacher acceptance first", status: "requested" },
      { status: 409 }
    );
  }

  await prisma.session.update({
    where: { id },
    data: { status: "active" },
  });
  return NextResponse.json({ ok: true, status: "active" });
}
