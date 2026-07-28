import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const MediaPreview = ({ open, onClose, src, type = 'image', title }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-[95%] max-h-[95%] w-full bg-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-full h-full">
          <div className="relative inline-block">
            {type === 'audio' ? (
              <audio controls className="w-full max-w-3xl">
                <source src={src} />
                Your browser does not support the audio element.
              </audio>
            ) : type === 'video' ? (
              <video controls className="max-h-[80vh] w-full max-w-4xl">
                <source src={src} />
                Your browser does not support the video element.
              </video>
            ) : (
              <img src={src} alt={title || 'Preview'} className="max-h-[80vh] w-auto max-w-full rounded-md object-contain" onError={(e) => { e.target.src = ''; }} />
            )}

            <button
              onClick={onClose}
              className="absolute right-2 top-2 z-50 p-2 bg-black/40 rounded-full hover:bg-black/60"
              aria-label="Close preview"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MediaPreview;
