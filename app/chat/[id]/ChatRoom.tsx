"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CallPanel } from "./CallPanel";

const POLL_INTERVAL_MS = 2000;
const fetchOpts = { credentials: "include" as RequestCredentials };

type SessionStatus = "requested" | "accepted" | "active" | "ended";

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  at: number;
};

type SessionApiResponse = {
  status?: SessionStatus;
  error?: string;
};

type WebRTCMessage = {
  type: "webrtc";
  payload?: {
    type?: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
};

function isSessionStatus(value: unknown): value is SessionStatus {
  return value === "requested" || value === "accepted" || value === "active" || value === "ended";
}

function getChatsHref(userRole: string): string {
  return userRole === "student" ? "/dashboard/student/chats" : "/dashboard/professional/sessions";
}

function AcceptSessionButton({
  sessionId,
  label,
  onAccepted,
}: {
  sessionId: string;
  label: string;
  onAccepted: (status?: SessionStatus) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/accept`, { method: "POST", ...fetchOpts });
      const data = (await res.json().catch(() => ({}))) as SessionApiResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not accept session.");
        return;
      }
      onAccepted(data.status);
    } catch {
      setError("Could not accept session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={accept}
        disabled={loading}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? "Accepting..." : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}

function RejectSessionButton({
  sessionId,
  onRejected,
}: {
  sessionId: string;
  onRejected: (status?: SessionStatus) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rejectRequest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reject`, { method: "POST", ...fetchOpts });
      const data = (await res.json().catch(() => ({}))) as SessionApiResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not reject request.");
        return;
      }
      onRejected(data.status);
    } catch {
      setError("Could not reject request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={rejectRequest}
        disabled={loading}
        className="rounded-lg border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
      >
        {loading ? "Rejecting..." : "Reject request"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}

export function ChatRoom({
  sessionId,
  userRole,
  userId,
  sessionStatus,
}: {
  sessionId: string;
  userRole: string;
  userId?: string;
  sessionStatus?: string;
}) {
  const router = useRouter();
  const initialStatus = isSessionStatus(sessionStatus) ? sessionStatus : "requested";
  const chatsHref = useMemo(() => getChatsHref(userRole), [userRole]);

  const [currentStatus, setCurrentStatus] = useState<SessionStatus>(initialStatus);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastWebRTCMessage, setLastWebRTCMessage] = useState<WebRTCMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const redirectedForEndedRef = useRef(false);

  const isRequested = currentStatus === "requested";
  const isAccepted = currentStatus === "accepted";
  const isActive = currentStatus === "active";
  const isEnded = currentStatus === "ended";

  const canProfessionalAccept = userRole === "professional" && isRequested;
  const canStudentAccept = userRole === "student" && isAccepted;
  const canAccept = canProfessionalAccept || canStudentAccept;

  const fetchSessionStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, fetchOpts);
      const data = (await res.json().catch(() => ({}))) as SessionApiResponse;
      if (!res.ok) {
        setStatusError(data.error ?? `Error ${res.status}`);
        return;
      }
      if (isSessionStatus(data.status)) {
        setCurrentStatus(data.status);
      }
      setStatusError(null);
    } catch {
      setStatusError("Could not sync session status.");
    }
  }, [sessionId]);

  const fetchMessages = useCallback(async () => {
    if (!isActive) {
      setMessages([]);
      setLoadError(null);
      setLoadedOnce(true);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`, fetchOpts);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: SessionStatus;
        messages?: ChatMessage[];
      };
      if (!res.ok) {
        setLoadError(data.error || `Error ${res.status}`);
        if (isSessionStatus(data.status)) setCurrentStatus(data.status);
        setLoadedOnce(true);
        return;
      }

      setLoadError(null);
      setLoadedOnce(true);
      if (isSessionStatus(data.status) && data.status !== "active") {
        setCurrentStatus(data.status);
      }
      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            text: m.text,
            at: m.at,
          }))
        );
      }
    } catch {
      setLoadError("Could not load messages. Check your connection.");
    }
  }, [isActive, sessionId]);

  useEffect(() => {
    void fetchSessionStatus();
    const interval = setInterval(() => {
      void fetchSessionStatus();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchSessionStatus]);

  useEffect(() => {
    if (!isActive) {
      setMessages([]);
      setLoadedOnce(true);
      return;
    }

    let mounted = true;
    void fetchMessages();
    const interval = setInterval(() => {
      if (mounted) void fetchMessages();
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchMessages, isActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (currentStatus !== "ended" || redirectedForEndedRef.current) return;
    redirectedForEndedRef.current = true;
    router.push(chatsHref);
    router.refresh();
  }, [currentStatus, chatsHref, router]);

  useEffect(() => {
    if (!isActive || isEnded) {
      if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
        wsRef.current.close();
      }
      wsRef.current = null;
      setWsConnected(false);
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;

    const connect = async () => {
      try {
        const tokenRes = await fetch("/api/ws-token", fetchOpts);
        const tokenData = (await tokenRes.json().catch(() => ({}))) as { token?: string };
        if (!tokenRes.ok || !tokenData.token || cancelled) {
          setWsConnected(false);
          return;
        }

        const configuredWsUrl = process.env.NEXT_PUBLIC_WS_URL;
        const fallbackWsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:3001`;
        const baseWsUrl = configuredWsUrl || fallbackWsUrl;

        ws = new WebSocket(
          `${baseWsUrl}?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(tokenData.token)}`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          if (!cancelled) setWsConnected(true);
        };

        ws.onclose = () => {
          if (cancelled) return;
          setWsConnected(false);
          if (wsRef.current === ws) wsRef.current = null;
        };

        ws.onerror = () => {
          if (!cancelled) setWsConnected(false);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as { type?: string; payload?: unknown };
            if (message.type === "webrtc") {
              setLastWebRTCMessage({
                type: "webrtc",
                payload: message.payload as WebRTCMessage["payload"],
              });
            }
            if (message.type === "session_ended") {
              setCurrentStatus("ended");
            }
          } catch {
            // ignore malformed WS messages
          }
        };
      } catch {
        if (!cancelled) setWsConnected(false);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      setWsConnected(false);
      if (ws && ws.readyState < WebSocket.CLOSING) {
        ws.close();
      }
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [isActive, isEnded, sessionId]);

  async function send() {
    const text = input.trim();
    if (!text || sending || !isActive || isEnded) return;

    setSendError(null);
    setSending(true);
    setInput("");

    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`, {
        ...fetchOpts,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: SessionStatus;
        message?: ChatMessage;
      };

      if (!res.ok) {
        if (isSessionStatus(data.status)) setCurrentStatus(data.status);
        setInput(text);
        setSendError(data.error || "Failed to send. Try again.");
        return;
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message as ChatMessage]);
      }
    } catch {
      setInput(text);
      setSendError("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function endSession() {
    if (ending || isEnded) return;
    setEnding(true);
    try {
      await fetch(`/api/sessions/${sessionId}/end`, { method: "POST", ...fetchOpts });
      setCurrentStatus("ended");
    } finally {
      setEnding(false);
    }
  }

  let waitingText = "";
  if (isRequested) {
    waitingText =
      userRole === "professional"
        ? "Student requested this chat. Accept permission to continue."
        : "Waiting for teacher to accept the chat request.";
  } else if (isAccepted) {
    waitingText =
      userRole === "student"
        ? "Teacher accepted. Confirm permission to start the chat."
        : "Waiting for student to confirm permission.";
  } else if (isEnded) {
    waitingText = "This session has been terminated.";
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 dark:bg-slate-900">
      <div className="shrink-0 border-b border-slate-200 p-2 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Both users must accept session permission before chat and calls are enabled.
        </p>
      </div>

      {isActive && (
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
          <CallPanel
            wsRef={wsRef}
            connected={wsConnected}
            lastWebRTCMessage={lastWebRTCMessage}
            onWebRTCMessageHandled={() => setLastWebRTCMessage(null)}
          />
          {!wsConnected && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Call option is available when the WebSocket server is running.
            </p>
          )}
        </div>
      )}

      {(isRequested || isAccepted || isEnded || statusError) && (
        <div className="shrink-0 border-b border-slate-200 bg-amber-50 p-3 dark:border-slate-800 dark:bg-amber-950/20">
          {waitingText && <p className="text-sm text-amber-900 dark:text-amber-200">{waitingText}</p>}
          {statusError && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{statusError}</p>}
          {canAccept && (
            <AcceptSessionButton
              sessionId={sessionId}
              label={canProfessionalAccept ? "Accept chat request" : "Confirm and start chat"}
              onAccepted={(status) => {
                if (status) setCurrentStatus(status);
                void fetchSessionStatus();
              }}
            />
          )}
          {canProfessionalAccept && (
            <RejectSessionButton
              sessionId={sessionId}
              onRejected={(status) => {
                if (status) setCurrentStatus(status);
                void fetchSessionStatus();
              }}
            />
          )}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchMessages()}
              className="mt-2 text-sm font-medium text-red-600 hover:underline dark:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {!isActive && !isEnded && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Chat will open after both participants accept permission.
          </p>
        )}

        {isActive && !loadError && loadedOnce && messages.length === 0 && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">No messages yet. Say hello!</p>
        )}

        {isActive && !loadError && !loadedOnce && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        )}

        {isActive &&
          messages.map((m) => {
            const isOwn = userId && m.senderId === userId;
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  isOwn
                    ? "ml-auto bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "mr-auto bg-white shadow-sm dark:bg-slate-800 dark:text-slate-50"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{m.text}</p>
                <p
                  className={`mt-1 text-xs ${
                    isOwn ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {new Date(m.at).toLocaleTimeString()}
                </p>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {sendError && <div className="shrink-0 px-4 py-1 text-sm text-red-600 dark:text-red-400">{sendError}</div>}

      <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={!isActive ? "Waiting for both users to accept" : isEnded ? "Session ended" : "Type a message..."}
            disabled={!isActive || isEnded}
            className="min-w-[120px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !isActive || isEnded}
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {sending ? "Sending..." : "Send"}
          </button>
          <button
            type="button"
            onClick={() => void endSession()}
            disabled={ending || isEnded}
            className="rounded-lg border-2 border-red-400 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            {ending ? "Terminating..." : "Terminate session"}
          </button>
        </div>
      </div>
    </div>
  );
}
