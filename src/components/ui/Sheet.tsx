import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  tall?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

/** Bottom sheet with drag-to-dismiss. Centered dialog on ≥640px. */
export function Sheet({ isOpen, onClose, title, tall = false, children, footer }: SheetProps) {
  const dragControls = useDragControls();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={`relative w-full sm:max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] shadow-float flex flex-col ${
              tall ? 'h-[88vh] sm:h-auto sm:max-h-[86vh]' : 'max-h-[88vh]'
            }`}
          >
            <div
              className="touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="pt-3 pb-1 flex justify-center sm:hidden" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-ink/15" />
              </div>
              <div className="flex items-start justify-between gap-4 px-6 pt-3 pb-2">
                {title ? <h2 className="font-display text-[22px] font-medium text-ink leading-tight">{title}</h2> : <span />}
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close"
                  className="glass size-9 shrink-0 rounded-full flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
            {footer && <div className="px-6 pb-[max(20px,var(--safe-bottom))] pt-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
