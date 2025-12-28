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
    { urls: 'stun:stun2.l.google.com:19302' },
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

  // Use state instead of ref to trigger re-renders
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const createPeerConnection = useCallback(() => {
    console.log('🔧 Creating peer connection...');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated:', event.candidate.type);
        const socket = getSocket();
        socket?.emit('call:ice-candidate', {
          to: callState.remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📥 Remote track received:', event.track.kind, event.track.enabled);
      const stream = event.streams[0];
      
      // Log audio tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('🎵 Audio tracks:', audioTracks.length, audioTracks.map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted })));
      console.log('📹 Video tracks:', videoTracks.length, videoTracks.map(t => ({ id: t.id, enabled: t.enabled })));
      
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.error('❌ Connection failed or disconnected');
        endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
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
      console.log('📞 Starting call:', { remoteUserId, callType });
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      };

      console.log('🎤 Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Log tracks
      console.log('✅ Media stream obtained');
      console.log('🎵 Audio tracks:', stream.getAudioTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled })));
      console.log('📹 Video tracks:', stream.getVideoTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled })));
      
      setLocalStream(stream);

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track to peer connection:', track.kind, track.id);
        pc.addTrack(track, stream);
      });

      console.log('📤 Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('✅ Local description set');

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
    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      toast({
        title: 'Call Failed',
        description: error.name === 'NotAllowedError' 
          ? 'Microphone/camera permission denied' 
          : 'Could not access camera/microphone',
        variant: 'destructive',
      });
    }
  }, [user, createPeerConnection, toast]);

  const answerCall = useCallback(async () => {
    if (!callState.remoteUserId || !callState.callType) return;

    try {
      console.log('📞 Answering call:', callState.callType);
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callState.callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      };

      console.log('🎤 Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Media stream obtained');
      console.log('🎵 Audio tracks:', stream.getAudioTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled })));
      console.log('📹 Video tracks:', stream.getVideoTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled })));
      
      setLocalStream(stream);

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('❌ No peer connection found');
        return;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track to peer connection:', track.kind, track.id);
        pc.addTrack(track, stream);
      });

      // Set remote description if we have a pending offer
      if (pendingOfferRef.current) {
        console.log('📥 Setting remote description from pending offer');
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        pendingOfferRef.current = null;
      }

      console.log('📤 Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('✅ Local description set');

      const socket = getSocket();
      socket?.emit('call:answer', {
        to: callState.remoteUserId,
        answer,
        callId: callState.callId,
      });

      setCallState(prev => ({ ...prev, status: 'connected' }));
    } catch (error: any) {
      console.error('❌ Error answering call:', error);
      toast({
        title: 'Call Failed',
        description: error.name === 'NotAllowedError' 
          ? 'Microphone/camera permission denied' 
          : 'Could not access camera/microphone',
        variant: 'destructive',
      });
      rejectCall();
    }
  }, [callState, toast]);

  const rejectCall = useCallback(() => {
    console.log('❌ Rejecting call');
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
    console.log('📴 Ending call');
    
    if (callState.remoteUserId && callState.callId) {
      const socket = getSocket();
      socket?.emit('call:end', {
        to: callState.remoteUserId,
        callId: callState.callId,
      });
    }

    // Stop all tracks
    localStream?.getTracks().forEach(track => {
      console.log('⏹️ Stopping local track:', track.kind);
      track.stop();
    });
    remoteStream?.getTracks().forEach(track => {
      console.log('⏹️ Stopping remote track:', track.kind);
      track.stop();
    });

    // Close peer connection
    peerConnectionRef.current?.close();

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    peerConnectionRef.current = null;
    pendingOfferRef.current = null;

    setCallState({
      callId: null,
      callType: null,
      status: 'idle',
      remoteUserId: null,
      remoteUserName: null,
      remoteUserAvatar: null,
      isIncoming: false,
    });
  }, [callState, localStream, remoteStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🎤 Audio', audioTrack.enabled ? 'unmuted' : 'muted');
        return !audioTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📹 Video', videoTrack.enabled ? 'on' : 'off');
        return !videoTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleIncomingCall = async ({ from, offer, callType, callId }: any) => {
      console.log('📞 Incoming call from:', from, 'Type:', callType);
      
      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Store offer to be used when user answers
      pendingOfferRef.current = offer;

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
      console.log('✅ Call answered, setting remote description');
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState(prev => ({ ...prev, status: 'connected' }));
      }
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      console.log('🧊 Received ICE candidate');
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ ICE candidate added');
        } catch (error) {
          console.error('❌ Error adding ICE candidate:', error);
        }
      }
    };

    const handleCallRejected = () => {
      console.log('❌ Call rejected');
      toast({
        title: 'Call Rejected',
        description: 'The user rejected your call',
      });
      endCall();
    };

    const handleCallEnded = () => {
      console.log('📴 Call ended by remote user');
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
    localStream,
    remoteStream,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
