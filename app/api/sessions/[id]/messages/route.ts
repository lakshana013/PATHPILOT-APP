import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMessages, addMessage } from "@/lib/chat-messages";
import { z } from "zod";

const postSchema = z.object({ text: z.string().min(1).max(10000) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalid" }, { status: 401 });
  const { id } = await params;
  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const isParticipant = s.studentId === userId || s.professionalId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (s.status === "ended") return NextResponse.json({ messages: [], status: "ended" });
  if (s.status !== "active") return NextResponse.json({ messages: [], status: s.status });
  const messages = getMessages(id);
  return NextResponse.json({ messages, status: s.status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalid" }, { status: 401 });
  const { id } = await params;
  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const isParticipant = s.studentId === userId || s.professionalId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (s.status === "ended") return NextResponse.json({ error: "Session ended" }, { status: 400 });
  if (s.status !== "active") {
    return NextResponse.json(
      { error: "Both teacher and student must accept before chat starts", status: s.status },
      { status: 409 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const text = parsed.data.text.trim();
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    senderId: userId,
    text,
    at: Date.now(),
  };
  addMessage(id, message);
  return NextResponse.json({ message });
}
