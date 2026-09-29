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
  if (!session || session.user.role !== "professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionRecord = await prisma.session.findUnique({
    where: { id },
  });
  if (!sessionRecord) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (sessionRecord.professionalId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sessionRecord.status === "ended") {
    return NextResponse.json({ ok: true, status: "ended" });
  }

  if (sessionRecord.status !== "requested") {
    return NextResponse.json(
      { error: "Only pending requests can be rejected" },
      { status: 409 }
    );
  }

  await prisma.session.update({
    where: { id },
    data: { status: "ended", endedAt: new Date() },
  });
  clearSessionMessages(id);

  return NextResponse.json({ ok: true, status: "ended" });
}
