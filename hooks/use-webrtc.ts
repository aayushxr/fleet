"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import type {
  CallState,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/types";

export interface PeerState {
  userId: string;
  username: string;
  stream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  connectionState: RTCPeerConnectionState;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type SocketRef = MutableRefObject<Socket<ServerToClientEvents, ClientToServerEvents> | null>;

export function useWebRTC(
  socketRef: SocketRef,
  userId: string,
  callState: CallState
) {
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const inCallRef = useRef(false);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  // Map peerId -> username for peers we know about
  const peerUsernamesRef = useRef<Map<string, string>>(new Map());

  // Speaking detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSocket = useCallback(() => socketRef.current, [socketRef]);

  // Keep inCallRef in sync
  useEffect(() => {
    inCallRef.current = inCall;
  }, [inCall]);

  // Build peer username map from callState
  useEffect(() => {
    for (const p of callState.participants) {
      if (p.userId !== userId) {
        peerUsernamesRef.current.set(p.userId, p.username);
      }
    }
  }, [callState.participants, userId]);

  const createPeerConnection = useCallback(
    (peerId: string, peerUsername: string, isOfferer: boolean) => {
      if (peerConnectionsRef.current.has(peerId)) return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionsRef.current.set(peerId, pc);

      // Add local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket()?.emit("call-signal-ice-candidate", {
            targetUserId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);

        // Set up speaking detection for remote audio
        if (event.track.kind === "audio") {
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            const source = audioContextRef.current.createMediaStreamSource(
              new MediaStream([event.track])
            );
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analysersRef.current.set(peerId, analyser);
          } catch {
            // Audio context may not be available
          }
        }

        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId);
          next.set(peerId, {
            userId: peerId,
            username: peerUsername,
            stream,
            isMuted: existing?.isMuted ?? false,
            isCameraOff: existing?.isCameraOff ?? false,
            isSpeaking: existing?.isSpeaking ?? false,
            connectionState: pc.connectionState,
          });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId);
          if (existing) {
            next.set(peerId, { ...existing, connectionState: pc.connectionState });
          }
          return next;
        });

        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          cleanupPeer(peerId);
        }
      };

      // Initialize peer state
      setPeers((prev) => {
        const next = new Map(prev);
        if (!next.has(peerId)) {
          next.set(peerId, {
            userId: peerId,
            username: peerUsername,
            stream: null,
            isMuted: false,
            isCameraOff: false,
            isSpeaking: false,
            connectionState: pc.connectionState,
          });
        }
        return next;
      });

      if (isOfferer) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              getSocket()?.emit("call-signal-offer", {
                targetUserId: peerId,
                sdp: pc.localDescription,
              });
            }
          })
          .catch(() => {
            setError("Failed to create offer");
          });
      }

      // Flush pending ICE candidates
      const pending = pendingCandidatesRef.current.get(peerId);
      if (pending && pc.remoteDescription) {
        for (const candidate of pending) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
        pendingCandidatesRef.current.delete(peerId);
      }
    },
    [getSocket]
  );

  const cleanupPeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    analysersRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  // Handle incoming signaling events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOffer = (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!inCallRef.current) return;
      const { fromUserId, sdp } = data;
      const peerUsername = peerUsernamesRef.current.get(fromUserId) ?? "Unknown";

      let pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) {
        createPeerConnection(fromUserId, peerUsername, false);
        pc = peerConnectionsRef.current.get(fromUserId)!;
      }

      pc.setRemoteDescription(new RTCSessionDescription(sdp))
        .then(() => {
          // Flush pending ICE candidates after setting remote description
          const pending = pendingCandidatesRef.current.get(fromUserId);
          if (pending) {
            for (const candidate of pending) {
              pc!.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            }
            pendingCandidatesRef.current.delete(fromUserId);
          }
          return pc!.createAnswer();
        })
        .then((answer) => pc!.setLocalDescription(answer))
        .then(() => {
          if (pc!.localDescription) {
            socket.emit("call-signal-answer", {
              targetUserId: fromUserId,
              sdp: pc!.localDescription,
            });
          }
        })
        .catch(() => {
          setError("Failed to handle offer");
        });
    };

    const handleAnswer = (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!inCallRef.current) return;
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
          .then(() => {
            // Flush pending ICE candidates
            const pending = pendingCandidatesRef.current.get(data.fromUserId);
            if (pending) {
              for (const candidate of pending) {
                pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
              }
              pendingCandidatesRef.current.delete(data.fromUserId);
            }
          })
          .catch(() => {
            setError("Failed to handle answer");
          });
      }
    };

    const handleIceCandidate = (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (!inCallRef.current) return;
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
      } else {
        // Queue candidate until remote description is set
        if (!pendingCandidatesRef.current.has(data.fromUserId)) {
          pendingCandidatesRef.current.set(data.fromUserId, []);
        }
        pendingCandidatesRef.current.get(data.fromUserId)!.push(data.candidate);
      }
    };

    socket.on("call-signal-offer", handleOffer);
    socket.on("call-signal-answer", handleAnswer);
    socket.on("call-signal-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("call-signal-offer", handleOffer);
      socket.off("call-signal-answer", handleAnswer);
      socket.off("call-signal-ice-candidate", handleIceCandidate);
    };
  }, [getSocket, createPeerConnection]);

  // When callState.participants changes and user is in call, manage peer connections
  useEffect(() => {
    if (!inCall || !userId) return;

    const currentPeerIds = new Set(peerConnectionsRef.current.keys());
    const participantIds = new Set(
      callState.participants.filter((p) => p.userId !== userId).map((p) => p.userId)
    );

    // Connect to new peers (deterministic: higher socket ID sends offer)
    for (const p of callState.participants) {
      if (p.userId === userId) continue;
      if (!peerConnectionsRef.current.has(p.userId)) {
        const isOfferer = userId > p.userId;
        peerUsernamesRef.current.set(p.userId, p.username);
        createPeerConnection(p.userId, p.username, isOfferer);
      }
    }

    // Clean up peers that left
    for (const peerId of currentPeerIds) {
      if (!participantIds.has(peerId)) {
        cleanupPeer(peerId);
      }
    }
  }, [inCall, userId, callState.participants, createPeerConnection, cleanupPeer]);

  // Speaking detection interval
  useEffect(() => {
    if (!inCall) return;

    speakingIntervalRef.current = setInterval(() => {
      for (const [peerId, analyser] of analysersRef.current) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, val) => sum + val, 0) / data.length;
        const isSpeaking = average > 30;

        setPeers((prev) => {
          const existing = prev.get(peerId);
          if (existing && existing.isSpeaking !== isSpeaking) {
            const next = new Map(prev);
            next.set(peerId, { ...existing, isSpeaking });
            return next;
          }
          return prev;
        });
      }
    }, 200);

    return () => {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
        speakingIntervalRef.current = null;
      }
    };
  }, [inCall]);

  // If call becomes inactive while we're in it, leave
  useEffect(() => {
    if (inCall && !callState.active) {
      cleanupAllPeers();
      setInCall(false);
    }
  }, [callState.active, inCall]);

  const cleanupAllPeers = useCallback(() => {
    for (const [peerId, pc] of peerConnectionsRef.current) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    analysersRef.current.clear();
    pendingCandidatesRef.current.clear();
    setPeers(new Map());

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const acquireMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      // Try audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOff(true);
        return stream;
      } catch {
        setError("Could not access microphone or camera");
        return null;
      }
    }
  }, []);

  const startCall = useCallback(async () => {
    const stream = await acquireMedia();
    if (!stream) return;
    setInCall(true);
    getSocket()?.emit("call-start");
  }, [acquireMedia, getSocket]);

  const joinCall = useCallback(async () => {
    const stream = await acquireMedia();
    if (!stream) return;
    setInCall(true);
    getSocket()?.emit("call-join");
  }, [acquireMedia, getSocket]);

  const leaveCall = useCallback(() => {
    // Stop local tracks
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Stop screen share
    if (screenStreamRef.current) {
      for (const track of screenStreamRef.current.getTracks()) {
        track.stop();
      }
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }

    cleanupAllPeers();
    setInCall(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setError(null);
    getSocket()?.emit("call-leave");
  }, [cleanupAllPeers, getSocket]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing, restore camera
      if (screenStreamRef.current) {
        for (const track of screenStreamRef.current.getTracks()) {
          track.stop();
        }
        screenStreamRef.current = null;
      }

      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        for (const pc of peerConnectionsRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack).catch(() => {});
          }
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track on all peer connections
        for (const pc of peerConnectionsRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack).catch(() => {});
          }
        }

        // Handle user stopping share via browser UI
        screenTrack.onended = () => {
          const videoTrack = localStreamRef.current?.getVideoTracks()[0];
          if (videoTrack) {
            for (const pc of peerConnectionsRef.current.values()) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender) {
                sender.replaceTrack(videoTrack).catch(() => {});
              }
            }
          }
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch {
        // User cancelled or error
      }
    }
  }, [isScreenSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (screenStreamRef.current) {
        for (const track of screenStreamRef.current.getTracks()) {
          track.stop();
        }
      }
      for (const pc of peerConnectionsRef.current.values()) {
        pc.close();
      }
      peerConnectionsRef.current.clear();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
      }
    };
  }, []);

  return {
    inCall,
    localStream,
    peers,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
