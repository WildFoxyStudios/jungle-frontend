"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// WebRTC configuration
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCStreamOptions {
  streamId: string | null;
  userId: string;
  signalingSocket: WebSocket | null;
  onError?: (error: Error) => void;
}

export function useWebRTCStream({
  streamId,
  userId,
  signalingSocket,
  onError,
}: UseWebRTCStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const streamerIdRef = useRef<string | null>(null);

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Failed to get user media:", error);
      onError?.(error as Error);
      throw error;
    }
  }, [onError]);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream, isStreamer: boolean) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    
    peer.onconnectionstatechange = () => {
      setConnectionState(peer.connectionState);
      setIsConnected(peer.connectionState === "connected");
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && signalingSocket?.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({
          type: "ice-candidate",
          streamId,
          from: userId,
          candidate: event.candidate,
        }));
      }
    };

    if (isStreamer) {
      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });
    } else {
      // Handle incoming remote stream
      peer.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
      };
    }

    peerRef.current = peer;
    return peer;
  }, [signalingSocket, streamId, userId]);

  // Start streaming (for streamer)
  const startStream = useCallback(async () => {
    if (!streamId || !signalingSocket) return;
    
    try {
      const stream = await initializeMedia();
      const peer = createPeerConnection(stream, true);
      
      // Create offer
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      
      // Send offer through signaling
      signalingSocket.send(JSON.stringify({
        type: "stream-offer",
        streamId,
        from: userId,
        sdp: offer.sdp,
      }));
      
      setIsStreaming(true);
      
      // Notify backend that stream started
      signalingSocket.send(JSON.stringify({
        type: "start-stream",
        streamId,
        streamerId: userId,
      }));
    } catch (error) {
      console.error("Failed to start stream:", error);
      onError?.(error as Error);
    }
  }, [streamId, signalingSocket, userId, initializeMedia, createPeerConnection, onError]);

  // Stop streaming
  const stopStream = useCallback(() => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    
    // Close peer connection
    peerRef.current?.close();
    peerRef.current = null;
    
    // Notify backend
    if (signalingSocket?.readyState === WebSocket.OPEN && streamId) {
      signalingSocket.send(JSON.stringify({
        type: "end-stream",
        streamId,
        streamerId: userId,
      }));
    }
    
    setIsStreaming(false);
    setIsConnected(false);
    setLocalStream(null);
    setRemoteStream(null);
    localStreamRef.current = null;
  }, [signalingSocket, streamId, userId]);

  // Join stream (for viewer)
  const joinStream = useCallback(async (targetStreamerId: string) => {
    if (!streamId || !signalingSocket) return;
    
    streamerIdRef.current = targetStreamerId;
    
    try {
      // Create peer connection without local stream (viewer)
      const peer = createPeerConnection(new MediaStream(), false);
      
      // Create offer to receive stream
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      
      // Send offer to join stream
      signalingSocket.send(JSON.stringify({
        type: "join-offer",
        streamId,
        from: userId,
        to: targetStreamerId,
        sdp: offer.sdp,
      }));
      
      // Notify backend that viewer joined
      signalingSocket.send(JSON.stringify({
        type: "join-stream",
        streamId,
        userId,
      }));
    } catch (error) {
      console.error("Failed to join stream:", error);
      onError?.(error as Error);
    }
  }, [streamId, signalingSocket, userId, createPeerConnection, onError]);

  // Leave stream
  const leaveStream = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    
    if (signalingSocket?.readyState === WebSocket.OPEN && streamId) {
      signalingSocket.send(JSON.stringify({
        type: "leave-stream",
        streamId,
        userId,
      }));
    }
    
    setIsConnected(false);
    setRemoteStream(null);
  }, [signalingSocket, streamId, userId]);

  // Handle incoming signaling messages
  useEffect(() => {
    if (!signalingSocket) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.streamId && message.streamId !== streamId) return;
        
        const peer = peerRef.current;
        if (!peer) return;

        switch (message.type) {
          case "stream-offer":
            // Streamer is creating stream, nothing to do on viewer side yet
            break;
            
          case "join-offer":
            // Viewer wants to join, streamer creates answer
            if (message.to === userId) {
              await peer.setRemoteDescription(new RTCSessionDescription({
                type: "offer",
                sdp: message.sdp,
              }));
              
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              
              signalingSocket.send(JSON.stringify({
                type: "stream-answer",
                streamId,
                from: userId,
                to: message.from,
                sdp: answer.sdp,
              }));
            }
            break;
            
          case "stream-answer":
            // Streamer receives answer from viewer
            if (message.to === userId) {
              await peer.setRemoteDescription(new RTCSessionDescription({
                type: "answer",
                sdp: message.sdp,
              }));
            }
            break;
            
          case "ice-candidate":
            if (message.to === userId || !message.to) {
              await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
            break;
            
          case "viewer-count":
            setViewerCount(message.count);
            break;
            
          case "streamer-left":
            if (streamerIdRef.current === message.streamerId) {
              leaveStream();
            }
            break;
        }
      } catch (error) {
        console.error("Error handling signaling message:", error);
      }
    };

    signalingSocket.addEventListener("message", handleMessage);
    return () => {
      signalingSocket.removeEventListener("message", handleMessage);
    };
  }, [signalingSocket, streamId, userId, leaveStream]);

  // Toggle audio/video
  const toggleAudio = useCallback((enabled: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  return {
    isStreaming,
    isConnected,
    viewerCount,
    connectionState,
    localStream,
    remoteStream,
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    toggleAudio,
    toggleVideo,
    initializeMedia,
  };
}
