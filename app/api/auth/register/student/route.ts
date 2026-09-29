import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  age: z.number().int().min(13).max(120),
  fieldOfStudy: z.string().min(1),
  interests: z.array(z.string()).default([]),
  goals: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "student",
      },
    });
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        name: data.name,
        age: data.age,
        fieldOfStudy: data.fieldOfStudy,
        interests: data.interests,
        goals: data.goals ?? null,
        onboardingComplete: false,
      },
    });
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
