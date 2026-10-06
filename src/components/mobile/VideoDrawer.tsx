import { Sheet } from '../ui/Sheet';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

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

  return (
    <Sheet
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title={exerciseName}
      tall
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xs">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={exerciseName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-ink-muted gap-2">
              <AlertCircle size={24} />
              <span className="text-xs">No video preview available</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>YouTube technique demonstration</span>
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-ink font-semibold hover:bg-white active:scale-95 transition-all"
            >
              <Play size={12} className="fill-current" />
              <span>Watch External</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </Sheet>
  );
}
