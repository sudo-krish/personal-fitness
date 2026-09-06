import React from 'react';
import { X, Video, ExternalLink, Dumbbell } from 'lucide-react';
import { Exercise } from '../types/workout';

interface VideoModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  accentColor: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  exercise,
  onClose,
  accentColor,
}) => {
  if (!exercise) return null;

  const getYouTubeId = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(exercise.videoUrl);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="glass-panel glass-panel-elevated video-cinema-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-icon" onClick={onClose} aria-label="Close Video">
          <X size={18} />
        </button>

        <div className="cinema-header">
          <div className="cinema-tagline" style={{ color: accentColor }}>
            <Video size={14} /> EXERCISE TUTORIAL
          </div>
          <h2 className="cinema-title">{exercise.name}</h2>
          <div className="cinema-pills">
            <span className="glass-pill glass-pill-accent">{exercise.muscle}</span>
            <span className="glass-pill glass-pill-amber">{exercise.pair}</span>
            <span className="glass-pill">
              {exercise.targetSets} Sets × {exercise.targetReps}
            </span>
          </div>
        </div>

        {/* Video Player */}
        <div className="cinema-screen-wrap">
          {videoId ? (
            <iframe
              className="cinema-iframe"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={`${exercise.name} Form Guide`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="cinema-fallback">
              <Dumbbell size={40} className="fallback-icon" />
              <p>Tutorial video stream</p>
              {exercise.videoUrl && (
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass btn-glass-primary"
                >
                  <ExternalLink size={15} /> Open Tutorial Link
                </a>
              )}
            </div>
          )}
        </div>

        {exercise.notes && (
          <div className="coach-guidance-box">
            <span className="guidance-label">Coaching Cue</span>
            <p className="guidance-text">{exercise.notes}</p>
          </div>
        )}

        {exercise.videoUrl && (
          <div className="cinema-footer">
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass yt-external-btn"
            >
              <ExternalLink size={13} /> Open in YouTube
            </a>
          </div>
        )}
      </div>

      <style>{`
        .video-cinema-container {
          max-width: 680px;
          width: 94%;
          padding: 2.25rem 2rem;
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--border-glass-strong);
          box-shadow: var(--shadow-xl);
          border-radius: 24px;
        }
        .cinema-header {
          margin-bottom: 1.25rem;
          padding-right: 2.5rem;
        }
        .cinema-tagline {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }
        .cinema-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .cinema-pills {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .cinema-screen-wrap {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          border-radius: 16px;
          overflow: hidden;
          background: #0f172a;
          border: 1px solid var(--border-glass);
          box-shadow: var(--shadow-md);
          margin-bottom: 1.25rem;
        }
        .cinema-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .cinema-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--text-muted);
          background: #f1f5f9;
        }
        .fallback-icon {
          color: var(--profile-accent);
        }
        .coach-guidance-box {
          background: rgba(2, 132, 199, 0.05);
          border: 1px solid rgba(2, 132, 199, 0.15);
          padding: 0.9rem 1.15rem;
          border-radius: 14px;
          margin-bottom: 1.25rem;
        }
        .guidance-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--profile-accent);
          margin-bottom: 0.25rem;
        }
        .guidance-text {
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.5;
        }
        .cinema-footer {
          display: flex;
          justify-content: flex-end;
        }
        .yt-external-btn {
          font-size: 0.825rem;
          font-weight: 700;
          padding: 0.45rem 0.95rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
        }
        .yt-external-btn:hover {
          background: #ffffff;
          color: var(--text-primary);
          border-color: var(--border-glass-strong);
        }
      `}</style>
    </div>
  );
};
