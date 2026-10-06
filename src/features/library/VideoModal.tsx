import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl?: string;
  onSaveManualUrl?: (newUrl: string) => Promise<void>;
}

export function VideoModal({
  isOpen,
  onClose,
  title,
  videoUrl,
  onSaveManualUrl,
}: VideoModalProps) {
  const [manualInput, setManualInput] = useState(videoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const getEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1` : null;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleSave = async () => {
    if (!onSaveManualUrl) return;
    setIsSaving(true);
    await onSaveManualUrl(manualInput);
    setIsSaving(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Form tutorial and technique demonstration."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Responsive Video Frame */}
        {embedUrl ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-slate-500 text-sm">
            No video link linked to this exercise yet.
          </div>
        )}

        {/* Edit Link input if onSaveManualUrl provided */}
        {onSaveManualUrl && (
          <div className="pt-2 flex flex-col sm:flex-row items-end gap-2">
            <div className="flex-1 w-full">
              <Input
                label="YouTube Video Link"
                placeholder="https://www.youtube.com/watch?v=..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              isLoading={isSaving}
              onClick={handleSave}
              className="shrink-0"
            >
              Update Link
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
