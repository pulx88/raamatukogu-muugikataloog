import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setError(null);
      return;
    }

    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setError(null);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Kaamera viga:', err);
        setError('Kaamera käivitamine ebaõnnestus. Palun luba kaamera kasutus või laadi foto seadmest üles.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    onCapture(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
    >
      <div
        id="camera-modal-content"
        className="relative bg-stone-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-800 flex flex-col"
      >
        <div className="p-4 flex items-center justify-between border-b border-stone-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Pildista raamatut</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-rose-300 text-sm">
              <p>{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Guidelines overlay */}
          <div className="absolute inset-8 border-2 border-amber-300/40 rounded-lg pointer-events-none flex items-center justify-center">
            <span className="text-amber-200/60 text-xs bg-black/40 px-3 py-1 rounded-full">
              Paiguta raamatu esikaas siia
            </span>
          </div>
        </div>

        <div className="p-4 flex items-center justify-around bg-stone-950">
          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-3 rounded-full bg-stone-800 text-stone-300 hover:text-white transition-colors"
            title="Vaheta kaamerat"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            id="shutter-capture-btn"
            type="button"
            onClick={handleCapture}
            disabled={Boolean(error)}
            className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 border-4 border-stone-900 text-stone-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            title="Tee foto"
          >
            <Camera className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xs font-medium px-3 py-2"
          >
            Loobu
          </button>
        </div>
      </div>
    </div>
  );
};
