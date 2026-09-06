import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudCheck, Flame, Check } from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface TopAppBarProps {
  activeProfile: 'krish' | 'theju';
  onToggleProfile: () => void;
  onSelectProfile?: (profile: 'krish' | 'theju') => void;
  isSyncing: boolean;
  streakCount: number;
}

export function TopAppBar({
  activeProfile,
  onToggleProfile,
  onSelectProfile,
  isSyncing,
  streakCount,
}: TopAppBarProps) {
  const isKrish = activeProfile === 'krish';
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const showTooltip = (msg: string) => {
    haptics.tap();
    setActiveTooltip(msg);
    setTimeout(() => setActiveTooltip((prev) => (prev === msg ? null : prev)), 2200);
  };

  const handleSelect = (targetProfile: 'krish' | 'theju') => {
    if (activeProfile !== targetProfile) {
      haptics.tap();
      if (onSelectProfile) {
        onSelectProfile(targetProfile);
      } else {
        onToggleProfile();
      }
    }
  };

  const handleScrollTop = () => {
    haptics.tap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="top-bar-header">
      <div className="top-bar-inner">
        {/* Left: Minimalist Line-Based Strength Emblem */}
        <div
          className="top-bar-brand"
          onClick={handleScrollTop}
          title="Tap to scroll to top"
          style={{ cursor: 'pointer' }}
        >
          <div className="top-bar-logo">
            <img
              src="/assets/app-logo.jpg"
              alt="Minimalist Strength Emblem"
              width={34}
              height={34}
            />
          </div>
        </div>

        {/* Center: Bespoke Liquid Glass Dual-Orb Switcher */}
        <div className="liquid-partner-capsule" role="tablist" aria-label="Select workout partner">
          {/* Krish Orb Button */}
          <button
            type="button"
            role="tab"
            aria-selected={isKrish}
            className={`liquid-partner-btn krish ${isKrish ? 'active' : ''}`}
            onClick={() => handleSelect('krish')}
          >
            {isKrish && (
              <motion.div
                layoutId="liquid-partner-active-halo"
                className="liquid-partner-active-halo krish"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <div className="liquid-partner-avatar">
              <span>K</span>
            </div>
            <span className="liquid-partner-name">Krish</span>
          </button>

          {/* Hairline Bridge Separator */}
          <div className="liquid-partner-bridge" />

          {/* Theju Orb Button */}
          <button
            type="button"
            role="tab"
            aria-selected={!isKrish}
            className={`liquid-partner-btn theju ${!isKrish ? 'active' : ''}`}
            onClick={() => handleSelect('theju')}
          >
            {!isKrish && (
              <motion.div
                layoutId="liquid-partner-active-halo"
                className="liquid-partner-active-halo theju"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <div className="liquid-partner-avatar">
              <span>T</span>
            </div>
            <span className="liquid-partner-name">Theju</span>
          </button>
        </div>

        {/* Right: Streak & Cloud Status (Zero horizontal overflow) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div
            className="top-status-streak cursor-pointer"
            onClick={() => showTooltip(`🔥 ${streakCount}-day workout streak!`)}
            title={`${streakCount} day workout streak`}
            style={{ cursor: 'pointer' }}
          >
            <Flame style={{ width: '13px', height: '13px', fill: 'currentColor' }} />
            <span>{streakCount}d</span>
          </div>

          <div
            onClick={() =>
              showTooltip(isSyncing ? 'Syncing to Cloudflare D1...' : 'Synced to Cloudflare D1')
            }
            style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', cursor: 'pointer' }}
            title={isSyncing ? 'Syncing to Cloudflare D1...' : 'Synced to D1'}
          >
            {isSyncing ? (
              <Cloud style={{ width: '14px', height: '14px', color: '#0284C7' }} />
            ) : (
              <CloudCheck style={{ width: '14px', height: '14px', color: '#10B981' }} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Micro Toast on Status Tap */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: '16px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#FFFFFF',
              fontSize: '0.6875rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check style={{ width: '11px', height: '11px', color: '#10B981' }} />
            <span>{activeTooltip}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
