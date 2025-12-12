import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Video, Circle, StopCircle, RefreshCw, Zap } from 'lucide-react';
import { MediaItem } from '../types';

interface CameraCaptureProps {
  onCapture: (item: MediaItem) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: mode === 'video' 
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, [facingMode, mode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]); // Re-run when mode or facingMode changes

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip if user facing
    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    ctx.drawImage(videoRef.current, 0, 0);
    
    // Create MediaItem
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1];
    
    onCapture({
      id: Math.random().toString(36).substring(7),
      type: 'image',
      mimeType: 'image/jpeg',
      data: base64Data,
      previewUrl: dataUrl
    });
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    // Use supported mime type
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        
        onCapture({
          id: Math.random().toString(36).substring(7),
          type: 'video',
          mimeType: 'video/webm',
          data: base64Data,
          previewUrl: dataUrl
        });
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-cyber-primary">
          <Zap size={20} className="animate-pulse" />
          <span className="font-tech text-xs uppercase tracking-widest">Live Feed // {mode}</span>
        </div>
        <button onClick={onClose} className="p-2 bg-black/50 rounded-full text-white hover:text-cyber-danger backdrop-blur-sm border border-white/10">
          <X size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-cyber-dark">
        {error ? (
           <div className="absolute inset-0 flex items-center justify-center text-cyber-danger p-8 text-center font-mono">
             {error}
           </div>
        ) : (
           <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             muted // Mute preview to prevent feedback
             className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
           />
        )}
        
        {/* HUD Elements */}
        <div className="absolute top-1/4 left-8 w-8 h-8 border-t-2 border-l-2 border-cyber-primary/50"></div>
        <div className="absolute top-1/4 right-8 w-8 h-8 border-t-2 border-r-2 border-cyber-primary/50"></div>
        <div className="absolute bottom-1/4 left-8 w-8 h-8 border-b-2 border-l-2 border-cyber-primary/50"></div>
        <div className="absolute bottom-1/4 right-8 w-8 h-8 border-b-2 border-r-2 border-cyber-primary/50"></div>
        
        {isRecording && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-red-500/80 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-white text-xs font-bold uppercase">REC</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/90 backdrop-blur-md p-6 border-t border-cyber-dark pb-12">
        <div className="flex justify-between items-center max-w-md mx-auto">
          
          {/* Gallery / Mode Switch Placeholder (Left) */}
          <button 
             onClick={switchCamera}
             className="p-3 rounded-full bg-cyber-panel border border-cyber-muted text-cyber-text hover:border-cyber-primary hover:text-cyber-primary transition-colors"
          >
             <RefreshCw size={20} />
          </button>

          {/* Shutter Button */}
          <div className="flex flex-col items-center gap-4">
             <button 
                onClick={mode === 'photo' ? handleCapturePhoto : toggleRecording}
                className={`
                  relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all transform active:scale-95
                  ${mode === 'photo' 
                    ? 'border-white hover:bg-white/10' 
                    : isRecording 
                      ? 'border-red-500 bg-red-500/20' 
                      : 'border-red-500 hover:bg-red-500/10'}
                `}
             >
                <div className={`
                   rounded-full transition-all duration-300
                   ${mode === 'photo' 
                     ? 'w-16 h-16 bg-white' 
                     : isRecording 
                       ? 'w-8 h-8 bg-red-500 rounded-md' 
                       : 'w-16 h-16 bg-red-500'}
                `}></div>
             </button>
          </div>

          {/* Mode Switcher (Right) */}
          <button 
            onClick={() => {
                if(!isRecording) setMode(prev => prev === 'photo' ? 'video' : 'photo');
            }}
            disabled={isRecording}
            className={`
              p-3 rounded-full border transition-colors flex items-center justify-center w-12 h-12
              ${mode === 'photo' ? 'border-cyber-primary text-cyber-primary bg-cyber-primary/10' : 'border-cyber-danger text-cyber-danger bg-cyber-danger/10'}
              ${isRecording ? 'opacity-30 cursor-not-allowed' : ''}
            `}
          >
             {mode === 'photo' ? <Camera size={20} /> : <Video size={20} />}
          </button>

        </div>
        
        {/* Mode Label */}
        <div className="text-center mt-4 flex justify-center gap-6 text-xs font-bold tracking-widest uppercase text-cyber-muted">
           <span className={mode === 'photo' ? 'text-cyber-primary' : ''}>Photo</span>
           <span className={mode === 'video' ? 'text-cyber-danger' : ''}>Video</span>
        </div>
      </div>
    </div>
  );
};
