import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  reportedUserId: z.string().min(1),
  reason: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { reportedUserId, reason, description } = schema.parse(body);
    if (reportedUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }
    const reported = await prisma.user.findUnique({
      where: { id: reportedUserId },
    });
    if (!reported) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedId: reportedUserId,
        reporterRole: session.user.role as "student" | "professional",
        reportedRole: reported.role,
        reason,
        description: description ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reports = await prisma.report.findMany({
    where: { reporterId: session.user.id },
    include: {
      reported: {
        select: { id: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reports });
}
