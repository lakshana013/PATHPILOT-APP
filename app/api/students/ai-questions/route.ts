import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPersonalizedQuestions } from "@/lib/ai";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    const questions = await getPersonalizedQuestions(profile);
    return NextResponse.json({ questions });
  } catch (e) {
    console.error("AI questions error:", e);
    return NextResponse.json(
      { error: "Could not generate questions. Please try again." },
      { status: 500 }
    );
  }
}
