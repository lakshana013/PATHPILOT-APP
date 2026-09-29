import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "";

export function verifyWsToken(token: string): { userId: string; role: string } | null {
  if (!SECRET) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const expectedSig = createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expectedSig, "base64url")))
      return null;
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as { userId: string; role: string; exp: number };
    if (Date.now() > payload.exp) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
