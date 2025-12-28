import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      handleCancel();
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setDuration(0);
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording && !audioBlob) {
    return (
      <Button
        size="icon"
        variant="ghost"
        onClick={startRecording}
        className="h-9 w-9 sm:h-10 sm:w-10 smooth-transition hover:scale-105"
      >
        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 animate-scale-in">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium">{formatDuration(duration)}</span>
            </div>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
          <Button
            size="icon"
            variant="destructive"
            onClick={stopRecording}
            className="h-9 w-9 smooth-transition hover:scale-105"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-9 w-9 smooth-transition hover:scale-105"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-medium">{formatDuration(duration)}</span>
            <div className="flex-1 h-1 bg-muted rounded-full">
              <div className="h-full bg-primary" style={{ width: '100%' }} />
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-9 w-9 smooth-transition hover:scale-105"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            className="h-9 w-9 smooth-transition hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}
