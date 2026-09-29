import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ professionalId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { professionalId } = schema.parse(body);
    const pro = await prisma.professionalProfile.findUnique({
      where: { userId: professionalId },
    });
    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }
    const existing = await prisma.session.findFirst({
      where: {
        studentId: session.user.id,
        professionalId,
        status: { in: ["requested", "accepted", "active"] },
      },
    });
    if (existing) {
      return NextResponse.json({ sessionId: existing.id });
    }
    const sessionRecord = await prisma.session.create({
      data: {
        studentId: session.user.id,
        professionalId,
        status: "requested",
      },
    });
    return NextResponse.json({ sessionId: sessionRecord.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
