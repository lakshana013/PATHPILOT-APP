import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().min(13).max(120).optional(),
  fieldOfStudy: z.string().min(1).optional(),
  interests: z.array(z.string()).optional(),
  goals: z.string().optional(),
  aiQuestionnaireAnswers: z.record(z.unknown()).optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const profile = await prisma.studentProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.age != null && { age: data.age }),
        ...(data.fieldOfStudy != null && { fieldOfStudy: data.fieldOfStudy }),
        ...(data.interests != null && { interests: data.interests }),
        ...(data.goals != null && { goals: data.goals }),
        ...(data.aiQuestionnaireAnswers != null && { aiQuestionnaireAnswers: data.aiQuestionnaireAnswers as object }),
        ...(data.onboardingComplete != null && { onboardingComplete: data.onboardingComplete }),
      },
    });
    return NextResponse.json(profile);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
