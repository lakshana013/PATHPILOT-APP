import { prisma } from "./db";
import type { StudentProfile, ProfessionalProfile } from "@prisma/client";

export type MentorWithSession = {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  experienceYears: number;
  sessionId?: string;
  sessionStatus?: string;
};

export async function getMentorsForStudent(studentUserId: string): Promise<MentorWithSession[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });
  if (!profile) return [];

  const professionals = await prisma.professionalProfile.findMany({
    include: { user: true },
  });

  const sessions = await prisma.session.findMany({
    where: {
      studentId: studentUserId,
      status: { in: ["requested", "accepted", "active"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, professionalId: true, status: true },
  });
  const sessionByPro = new Map(sessions.map((s) => [s.professionalId, { id: s.id, status: s.status }]));

  const scored = professionals.map((pro) => ({
    pro,
    score: scoreMatch(profile, pro),
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 20).map(({ pro }) => {
    const session = sessionByPro.get(pro.userId);
    return {
      id: pro.userId,
      name: pro.name,
      bio: pro.bio,
      expertise: pro.expertise,
      experienceYears: pro.experienceYears,
      ...(session && { sessionId: session.id, sessionStatus: session.status }),
    };
  });
}

function scoreMatch(student: StudentProfile, professional: ProfessionalProfile): number {
  let score = 0;
  const fieldLower = student.fieldOfStudy.toLowerCase();
  const goalsLower = (student.goals ?? "").toLowerCase();
  for (const exp of professional.expertise) {
    const expLower = exp.toLowerCase();
    if (fieldLower.includes(expLower) || expLower.includes(fieldLower)) score += 10;
    if (goalsLower.includes(expLower)) score += 5;
  }
  for (const interest of student.interests) {
    const interestLower = interest.toLowerCase();
    if (professional.expertise.some((e) => e.toLowerCase().includes(interestLower))) score += 5;
  }
  score += Math.min(professional.experienceYears, 20);
  return score;
}
