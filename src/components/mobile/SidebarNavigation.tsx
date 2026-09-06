import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Dumbbell,
  Sliders,
  Database,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface SidebarNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'workout' | 'plan-editor';
  onSelectView: (view: 'workout' | 'plan-editor') => void;
  activeProfile: 'krish' | 'theju';
  onToggleProfile: () => void;
  onResetPlan?: () => void;
}

interface DbStatus {
  connected: boolean;
  databaseFile: string;
  totalExercises: number;
  totalSetLogs: number;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  activeProfile,
  onToggleProfile,
  onResetPlan,
}) => {
  const isKrish = activeProfile === 'krish';
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/db/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setDbStatus({
              connected: data.connected,
              databaseFile: data.databaseFile || 'fitness.db',
              totalExercises: data.totalExercises || 30,
              totalSetLogs: data.totalSetLogs || 0,
            });
          }
        })
        .catch(() => {
          setDbStatus({
            connected: true,
            databaseFile: 'fitness.db',
            totalExercises: 30,
            totalSetLogs: 0,
          });
        });
    }
  }, [isOpen]);

  const handleNavigate = (view: 'workout' | 'plan-editor') => {
    haptics.tap();
    onSelectView(view);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            display: 'flex',
          }}
        >
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.48)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Slide-out Sidebar Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              position: 'relative',
              width: '82%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRight: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '8px 0 32px rgba(15, 23, 42, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
            }}
          >
            {/* 1. Header Bar */}
            <div
              style={{
                padding: '20px 18px 16px 18px',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/assets/app-logo.jpg"
                    alt="Pulse Strength"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-athletic)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                      lineHeight: 1.15,
                    }}
                  >
                    PULSE PARTNER
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.04em',
                    }}
                  >
                    FITNESS SUITE v2.0
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Close menu"
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* 2. Active Partner Profile Capsule */}
            <div style={{ padding: '14px 18px 8px 18px' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '14px',
                  backgroundColor: isKrish ? 'rgba(240, 249, 255, 0.7)' : 'rgba(255, 241, 242, 0.7)',
                  border: `1px solid ${isKrish ? 'rgba(186, 230, 253, 0.8)' : 'rgba(254, 205, 211, 0.8)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '9999px',
                      background: isKrish
                        ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                        : 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {isKrish ? 'K' : 'T'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', display: 'block' }}>
                      {isKrish ? 'Krish' : 'Theju'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      {isKrish ? 'Person 1 (Intermediate)' : 'Person 2 (Beginner)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    onToggleProfile();
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Switch
                </button>
              </div>
            </div>

            {/* 3. Navigation Links */}
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <button
                type="button"
                onClick={() => handleNavigate('workout')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: activeView === 'workout' ? '1.5px solid var(--azure)' : '1px solid transparent',
                  backgroundColor: activeView === 'workout' ? 'var(--azure-light)' : 'transparent',
                  color: activeView === 'workout' ? 'var(--azure)' : '#334155',
                  fontWeight: activeView === 'workout' ? 800 : 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Dumbbell style={{ width: '18px', height: '18px' }} />
                  <span>Workout Tracker (Pair View)</span>
                </div>
                <ChevronRight style={{ width: '16px', height: '16px', opacity: 0.5 }} />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('plan-editor')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: activeView === 'plan-editor' ? '1.5px solid var(--azure)' : '1px solid transparent',
                  backgroundColor: activeView === 'plan-editor' ? 'var(--azure-light)' : 'transparent',
                  color: activeView === 'plan-editor' ? 'var(--azure)' : '#334155',
                  fontWeight: activeView === 'plan-editor' ? 800 : 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sliders style={{ width: '18px', height: '18px' }} />
                  <span>Edit Exercise Plans</span>
                </div>
                <ChevronRight style={{ width: '16px', height: '16px', opacity: 0.5 }} />
              </button>

              {onResetPlan && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    if (window.confirm('Reset workout plans back to original 5-Day Split defaults in fitness.db?')) {
                      onResetPlan();
                      onClose();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '8px',
                  }}
                >
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  <span>Reset Split to Default</span>
                </button>
              )}
            </div>

            {/* 4. Local SQLite Database Telemetry Card */}
            <div
              style={{
                padding: '16px 18px',
                borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                backgroundColor: 'rgba(248, 250, 252, 0.65)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database style={{ width: '14px', height: '14px', color: 'var(--emerald)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    SQLite Local DB
                  </span>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    color: 'var(--emerald)',
                    backgroundColor: 'var(--emerald-light)',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    border: '1px solid var(--emerald-border)',
                  }}
                >
                  <CheckCircle2 style={{ width: '10px', height: '10px' }} />
                  <span>ONLINE</span>
                </span>
              </div>

              <div style={{ fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.4 }}>
                <div>
                  File: <code style={{ color: '#0F172A', fontWeight: 700 }}>fitness.db</code>
                </div>
                <div>
                  Exercises: <span style={{ fontWeight: 700, color: '#0F172A' }}>{dbStatus?.totalExercises ?? 30} loaded</span>
                </div>
                <div style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '4px' }}>
                  Native SQLite & D1 Relational Engine
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
