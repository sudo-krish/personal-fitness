import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, AlertCircle, Play } from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface VideoDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  exerciseName: string;
}

export function VideoDrawer({
  isOpen,
  onOpenChange,
  videoUrl,
  exerciseName,
}: VideoDrawerProps) {
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube-nocookie.com/embed/')) return url;
      if (url.includes('youtube.com/embed/')) {
        return url.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
      }

      if (url.includes('/shorts/')) {
        const parts = url.split('/shorts/');
        const videoId = parts[1]?.split('?')[0]?.split('&')[0]?.replace('/', '');
        if (videoId) {
          return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
        }
      }

      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&playsinline=1`;
      }

      if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.replace('/', '').split('?')[0];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
      }
    } catch {}
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleClose = () => {
    haptics.tap();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-t-[28px] sm:rounded-3xl flex flex-col overflow-hidden pb-6 z-10"
          >
            {/* Grab Handle (mobile) */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3 mb-1 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0 flex-1 pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Technique Demonstration
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {exerciseName}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
                aria-label="Close video drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Player Container */}
            <div className="p-6 flex flex-col gap-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={exerciseName}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <AlertCircle size={24} />
                    <span className="text-xs">No video preview available</span>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">
                  YouTube technique tutorial
                </span>

                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                  >
                    <Play size={12} className="fill-current" />
                    <span>Watch on YouTube</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
