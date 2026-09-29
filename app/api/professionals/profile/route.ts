import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().min(1).optional(),
  expertise: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  experienceDescription: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const profile = await prisma.professionalProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.bio != null && { bio: data.bio }),
        ...(data.expertise != null && { expertise: data.expertise }),
        ...(data.experienceYears != null && { experienceYears: data.experienceYears }),
        ...(data.experienceDescription != null && { experienceDescription: data.experienceDescription }),
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
