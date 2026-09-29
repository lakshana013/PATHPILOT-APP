"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type CallPanelProps = {
  wsRef: React.RefObject<WebSocket | null>;
  connected: boolean;
  lastWebRTCMessage: { type: string; payload?: { type?: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit } } | null;
  onWebRTCMessageHandled: () => void;
};

export function CallPanel({ wsRef, connected, lastWebRTCMessage, onWebRTCMessageHandled }: CallPanelProps) {
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, []);

  const handleIncomingOffer = useCallback(async () => {
    const payload = lastWebRTCMessage?.payload;
    if (!payload?.sdp || !wsRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          const candidate = e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex };
          wsRef.current?.send(
            JSON.stringify({ type: "webrtc", payload: { type: "ice", candidate } })
          );
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsRef.current?.send(
        JSON.stringify({ type: "webrtc", payload: { type: "answer", sdp: answer } })
      );
      setInCall(true);
    } catch (err) {
      console.error("Handle offer failed", err);
    }
    onWebRTCMessageHandled();
  }, [lastWebRTCMessage?.payload, wsRef, onWebRTCMessageHandled]);

  useEffect(() => {
    const payload = lastWebRTCMessage?.payload;
    if (!payload) return;
    if (payload.type === "offer") {
      if (!pcRef.current) {
        setTimeout(() => {
          void handleIncomingOffer();
        }, 0);
      } else {
        setTimeout(() => onWebRTCMessageHandled(), 0);
      }
      return;
    }
    const pc = pcRef.current;
    if (!pc) return;
    if (payload.type === "answer" && payload.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      onWebRTCMessageHandled();
    } else if (payload.type === "ice" && payload.candidate) {
      try {
        pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.warn("addIceCandidate failed", err);
      }
      onWebRTCMessageHandled();
    }
  }, [lastWebRTCMessage, handleIncomingOffer, onWebRTCMessageHandled]);

  async function startCall() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: true,
      });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          const candidate = e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex };
          wsRef.current?.send(
            JSON.stringify({ type: "webrtc", payload: { type: "ice", candidate } })
          );
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current?.send(
        JSON.stringify({
          type: "webrtc",
          payload: { type: "offer", sdp: offer },
        })
      );
      setInCall(true);
    } catch (err) {
      console.error("Start call failed", err);
    }
  }

  function endCall() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setInCall(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {!inCall ? (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={videoEnabled}
              onChange={(e) => setVideoEnabled(e.target.checked)}
            />
            Video on
          </label>
          <button
            type="button"
            onClick={startCall}
            disabled={!connected}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start voice/video call
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">You</p>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-32 w-full rounded bg-slate-800 object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Remote</p>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-32 w-full rounded bg-slate-800 object-cover"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={endCall}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            End call
          </button>
        </div>
      )}
    </div>
  );
}
