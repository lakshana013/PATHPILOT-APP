import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getMentorsForStudent } from "@/lib/matching";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const mentors = await getMentorsForStudent(session.user.id);
  return NextResponse.json({ mentors });
}
