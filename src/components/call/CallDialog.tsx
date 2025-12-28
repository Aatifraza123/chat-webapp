import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { CallStatus, CallType } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';

interface CallDialogProps {
  open: boolean;
  callType: CallType | null;
  status: CallStatus;
  isIncoming: boolean;
  remoteUserName: string | null;
  remoteUserAvatar: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => boolean;
  onToggleVideo: () => boolean;
}

export function CallDialog({
  open,
  callType,
  status,
  isIncoming,
  remoteUserName,
  remoteUserAvatar,
  localStream,
  remoteStream,
  onAnswer,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
}: CallDialogProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (status === 'connected') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const muted = onToggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = onToggleVideo();
    setIsVideoOff(videoOff);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-full sm:max-w-4xl p-0 bg-black border-none h-screen sm:h-auto">
        <DialogTitle className="sr-only">
          {callType === 'video' ? 'Video' : 'Voice'} Call with {userName}
        </DialogTitle>
        <div className="relative h-full sm:h-[600px] flex flex-col">
          {/* Remote Video/Avatar */}
          <div className="flex-1 relative bg-gray-900">
            {callType === 'video' && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 mb-4">
                  <AvatarImage src={remoteUserAvatar || ''} />
                  <AvatarFallback className="text-3xl sm:text-4xl">
                    {remoteUserName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  {remoteUserName || 'User'}
                </h3>
                <p className="text-white/70 text-sm sm:text-base">
                  {status === 'calling' && 'Calling...'}
                  {status === 'ringing' && 'Incoming call...'}
                  {status === 'connected' && formatDuration(callDuration)}
                </p>
              </div>
            )}

            {/* Local Video (Picture-in-Picture) */}
            {callType === 'video' && localStream && status === 'connected' && (
              <div className="absolute top-4 right-4 w-24 h-32 sm:w-48 sm:h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="p-4 sm:p-6 bg-gray-900/95 backdrop-blur">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {/* Incoming Call Actions */}
              {isIncoming && status === 'ringing' && (
                <>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
                    onClick={onReject}
                  >
                    <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                  <Button
                    size="lg"
                    className="rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-green-500 hover:bg-green-600"
                    onClick={onAnswer}
                  >
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </>
              )}

              {/* Active Call Controls */}
              {status === 'connected' && (
                <>
                  <Button
                    size="lg"
                    variant={isMuted ? 'destructive' : 'secondary'}
                    className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </Button>

                  {callType === 'video' && (
                    <Button
                      size="lg"
                      variant={isVideoOff ? 'destructive' : 'secondary'}
                      className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
                      onClick={handleToggleVideo}
                    >
                      {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
                    onClick={onEnd}
                  >
                    <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </>
              )}

              {/* Calling/Waiting State */}
              {status === 'calling' && (
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
                  onClick={onEnd}
                >
                  <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
