import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = {
    userId: session.user.id,
    role: session.user.role,
    exp: Date.now() + TTL_MS,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  const token = `${payloadB64}.${sig}`;
  return NextResponse.json({ token });
}
