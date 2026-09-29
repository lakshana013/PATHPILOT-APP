/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env") });
const WebSocket = require("ws");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const PORT = Number(process.env.WS_PORT) || 3001;
const SECRET = process.env.NEXTAUTH_SECRET || "";

function verifyToken(token) {
  if (!SECRET) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf))
      return null;
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    if (Date.now() > payload.exp) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

const rooms = new Map();
const sessionMessages = new Map();

function getRoom(sessionId) {
  if (!rooms.has(sessionId)) rooms.set(sessionId, new Set());
  return rooms.get(sessionId);
}

const wss = new WebSocket.Server({ port: PORT });

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId");
  const token = url.searchParams.get("token");
  if (!sessionId || !token) {
    ws.close(4000, "Missing sessionId or token");
    return;
  }
  const user = verifyToken(token);
  if (!user) {
    ws.close(4001, "Invalid token");
    return;
  }
  let session;
  try {
    session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
  } catch {
    ws.close(4002, "DB error");
    return;
  }
  if (!session) {
    ws.close(4003, "Session not found");
    return;
  }
  const isParticipant =
    session.studentId === user.userId || session.professionalId === user.userId;
  if (!isParticipant) {
    ws.close(4004, "Not a participant");
    return;
  }
  if (session.status === "ended") {
    ws.close(4005, "Session ended");
    return;
  }
  if (session.status !== "active") {
    ws.close(4006, "Session not active");
    return;
  }

  ws.userId = user.userId;
  ws.sessionId = sessionId;
  const room = getRoom(sessionId);
  room.add(ws);

  if (!sessionMessages.has(sessionId)) sessionMessages.set(sessionId, []);
  const history = sessionMessages.get(sessionId);
  ws.send(
    JSON.stringify({
      type: "history",
      payload: history,
    })
  );

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "chat" && msg.payload?.text) {
        const payload = {
          id: msg.payload.id || (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
          senderId: ws.userId,
          text: msg.payload.text,
          at: msg.payload.at || Date.now(),
        };
        history.push(payload);
        const toSend = JSON.stringify({ type: "chat", payload });
        room.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(toSend);
        });
      }
      if (msg.type === "webrtc") {
        room.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify({ type: "webrtc", payload: msg.payload }));
        });
      }
      if (msg.type === "end_session") {
        sessionMessages.delete(sessionId);
        room.forEach((client) => {
          if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify({ type: "session_ended" }));
        });
      }
    } catch {
      // ignore
    }
  });

  ws.on("close", () => {
    room.delete(ws);
    if (room.size === 0) rooms.delete(sessionId);
  });
});

function clearSessionMessages(sessionId) {
  sessionMessages.delete(sessionId);
}

module.exports = { clearSessionMessages };

console.log(`WebSocket server listening on port ${PORT}`);
