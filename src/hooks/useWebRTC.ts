import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallState {
  callId: string | null;
  callType: CallType | null;
  status: CallStatus;
  remoteUserId: string | null;
  remoteUserName: string | null;
  remoteUserAvatar: string | null;
  isIncoming: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    callType: null,
    status: 'idle',
    remoteUserId: null,
    remoteUserName: null,
    remoteUserAvatar: null,
    isIncoming: false,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && callState.remoteUserId) {
        const socket = getSocket();
        socket?.emit('call:ice-candidate', {
          to: callState.remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, [callState.remoteUserId]);

  const startCall = useCallback(async (
    remoteUserId: string,
    remoteUserName: string,
    remoteUserAvatar: string,
    callType: CallType
  ) => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket?.emit('call:initiate', {
        to: remoteUserId,
        offer,
        callType,
      });

      setCallState({
        callId: `${user?.id}-${remoteUserId}-${Date.now()}`,
        callType,
        status: 'calling',
        remoteUserId,
        remoteUserName,
        remoteUserAvatar,
        isIncoming: false,
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Call Failed',
        description: 'Could not access camera/microphone',
        variant: 'destructive',
      });
    }
  }, [user, createPeerConnection, toast]);

  const answerCall = useCallback(async () => {
    if (!callState.remoteUserId || !callState.callType) return;

    try {
      const constraints = {
        audio: true,
        video: callState.callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const pc = peerConnectionRef.current;
      if (!pc) return;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit('call:answer', {
        to: callState.remoteUserId,
        answer,
        callId: callState.callId,
      });

      setCallState(prev => ({ ...prev, status: 'connected' }));
    } catch (error) {
      console.error('Error answering call:', error);
      toast({
        title: 'Call Failed',
        description: 'Could not access camera/microphone',
        variant: 'destructive',
      });
      rejectCall();
    }
  }, [callState, toast]);

  const rejectCall = useCallback(() => {
    if (callState.remoteUserId && callState.callId) {
      const socket = getSocket();
      socket?.emit('call:reject', {
        to: callState.remoteUserId,
        callId: callState.callId,
      });
    }
    endCall();
  }, [callState]);

  const endCall = useCallback(() => {
    if (callState.remoteUserId && callState.callId) {
      const socket = getSocket();
      socket?.emit('call:end', {
        to: callState.remoteUserId,
        callId: callState.callId,
      });
    }

    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();

    // Reset refs
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    peerConnectionRef.current = null;

    setCallState({
      callId: null,
      callType: null,
      status: 'idle',
      remoteUserId: null,
      remoteUserName: null,
      remoteUserAvatar: null,
      isIncoming: false,
    });
  }, [callState]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleIncomingCall = async ({ from, offer, callType, callId }: any) => {
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Get user info (you'll need to fetch this from your API)
      setCallState({
        callId,
        callType,
        status: 'ringing',
        remoteUserId: from,
        remoteUserName: 'User', // Fetch actual name
        remoteUserAvatar: '', // Fetch actual avatar
        isIncoming: true,
      });
    };

    const handleCallAnswered = async ({ answer }: any) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState(prev => ({ ...prev, status: 'connected' }));
      }
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallRejected = () => {
      toast({
        title: 'Call Rejected',
        description: 'The user rejected your call',
      });
      endCall();
    };

    const handleCallEnded = () => {
      toast({
        title: 'Call Ended',
        description: 'The call has been ended',
      });
      endCall();
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:answered', handleCallAnswered);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:answered', handleCallAnswered);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [user, createPeerConnection, toast, endCall]);

  return {
    callState,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
