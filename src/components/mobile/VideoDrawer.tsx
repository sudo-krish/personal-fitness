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
  // Robust YouTube embed URL extractor (handles standard, shorts, and youtu.be)
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube-nocookie.com/embed/')) return url;
      if (url.includes('youtube.com/embed/')) {
        return url.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
      }

      // Handle YouTube Shorts: /shorts/VIDEO_ID
      if (url.includes('/shorts/')) {
        const parts = url.split('/shorts/');
        const videoId = parts[1]?.split('?')[0]?.split('&')[0]?.replace('/', '');
        if (videoId) {
          return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
        }
      }

      const parsed = new URL(url);

      // Standard youtube.com/watch?v=ID
      if (parsed.hostname.includes('youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&playsinline=1`;
      }

      // youtu.be/ID
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {/* Dim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
              borderTopLeftRadius: '26px',
              borderTopRightRadius: '26px',
              borderTop: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 -16px 40px rgba(15, 23, 42, 0.14), inset 0 1px 1px #FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              paddingBottom: 'calc(var(--safe-bottom, 0px) + 20px)',
            }}
          >
            {/* Grab Handle */}
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: '#CBD5E1',
                margin: '10px auto 4px auto',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
              }}
            >
              <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                <span className="tech-tag" style={{ marginBottom: '2px' }}>
                  TECHNIQUE GUIDE
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-athletic)',
                    fontSize: '1.1875rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {exerciseName}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'rgba(241, 245, 249, 0.9)',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Video Player Container */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  backgroundColor: '#0F172A',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)',
                }}
              >
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={exerciseName}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#94A3B8',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle style={{ width: '24px', height: '24px' }} />
                    <span style={{ fontSize: '0.875rem' }}>No direct preview available</span>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Exercise form demonstration
                </span>

                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#0284C7',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Play style={{ width: '11px', height: '11px', fill: 'currentColor' }} />
                    <span>Open Form in YouTube</span>
                    <ExternalLink style={{ width: '11px', height: '11px' }} />
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
