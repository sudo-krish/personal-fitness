import React, { useState } from 'react';
import { UserProfile } from '../types/workout';
import { Check, X, Edit3, ArrowRight } from 'lucide-react';

interface ProfileSwitcherModalProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onClose: () => void;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onUpdateProfile,
  onClose,
}) => {
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfile) {
      onUpdateProfile(editingProfile);
      setEditingProfile(null);
    }
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="glass-panel glass-panel-elevated netflix-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-icon" onClick={onClose} aria-label="Close Profile Switcher">
          <X size={18} />
        </button>

        <div className="netflix-modal-header">
          <span className="netflix-tagline">PROFILE SELECTOR</span>
          <h2 className="netflix-headline">Who's Working Out?</h2>
          <p className="netflix-subhead">
            Switch between profiles for independent progression logs, weights, and routine goals.
          </p>
        </div>

        {editingProfile ? (
          /* Profile Edit Form */
          <form onSubmit={handleSaveEdit} className="profile-edit-stack">
            <h3 className="edit-box-title">Edit {editingProfile.name}'s Profile</h3>

            <div className="edit-field">
              <label>Name</label>
              <input
                type="text"
                className="glass-input"
                value={editingProfile.name}
                onChange={(e) =>
                  setEditingProfile({ ...editingProfile, name: e.target.value })
                }
                required
              />
            </div>

            <div className="edit-row">
              <div className="edit-field">
                <label>Age</label>
                <input
                  type="number"
                  className="glass-input"
                  value={editingProfile.age}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      age: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="edit-field">
                <label>Stats (Height / Weight)</label>
                <input
                  type="text"
                  className="glass-input"
                  value={editingProfile.stats}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, stats: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="edit-field">
              <label>Focus / Training Notes</label>
              <textarea
                className="glass-input textarea-tall"
                rows={3}
                value={editingProfile.bio}
                onChange={(e) =>
                  setEditingProfile({ ...editingProfile, bio: e.target.value })
                }
              />
            </div>

            <div className="edit-actions">
              <button
                type="button"
                className="btn-glass"
                onClick={() => setEditingProfile(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-glass btn-glass-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Netflix Profiles Grid */
          <div className="netflix-profiles-grid">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              const monogram = profile.name.charAt(0).toUpperCase();

              return (
                <div
                  key={profile.id}
                  className={`netflix-profile-card ${isActive ? 'card-active-profile' : ''}`}
                  onClick={() => {
                    onSelectProfile(profile.id);
                    onClose();
                  }}
                  style={{
                    borderColor: isActive ? profile.themeColor : undefined,
                  }}
                >
                  <div className="liquid-shimmer" />

                  {isActive && (
                    <div
                      className="active-badge-pill"
                      style={{ background: profile.themeColor }}
                    >
                      <Check size={11} strokeWidth={3} /> Active
                    </div>
                  )}

                  <button
                    className="quick-edit-trigger"
                    title="Edit Profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProfile({ ...profile });
                    }}
                  >
                    <Edit3 size={13} />
                  </button>

                  <div
                    className="monogram-avatar-large"
                    style={{
                      background: profile.accentGradient,
                      boxShadow: `0 8px 24px -2px ${profile.glowColor}`,
                    }}
                  >
                    <span>{monogram}</span>
                  </div>

                  <h3 className="profile-display-name">{profile.name}</h3>
                  <span className="profile-role-sub">{profile.title}</span>

                  <div className="profile-stats-token">
                    <span>{profile.stats}</span>
                    <span className="dot">•</span>
                    <span>{profile.age} yrs</span>
                  </div>

                  <p className="profile-bio-snippet">{profile.bio}</p>

                  <div
                    className="select-profile-cta"
                    style={{
                      color: isActive ? profile.themeColor : undefined,
                    }}
                  >
                    <span>{isActive ? 'Current Profile' : `Switch to ${profile.name}`}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .netflix-modal-box {
          max-width: 740px;
          width: 100%;
          padding: 2.5rem;
          position: relative;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: var(--shadow-glass-lg);
        }
        .modal-close-icon {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid var(--border-glass-subtle);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-close-icon:hover {
          color: var(--text-primary);
          background: rgba(15, 23, 42, 0.08);
        }
        .netflix-modal-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .netflix-tagline {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--profile-accent);
          text-transform: uppercase;
        }
        .netflix-headline {
          font-size: 1.85rem;
          margin-top: 0.25rem;
          margin-bottom: 0.4rem;
        }
        .netflix-subhead {
          font-size: 0.9rem;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto;
        }
        .netflix-profiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .netflix-profile-card {
          padding: 2rem 1.5rem;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-glass-sm);
        }
        .netflix-profile-card:hover {
          transform: translateY(-3px);
          border-color: var(--border-glass-hover);
          box-shadow: var(--shadow-glass-md);
          background: #ffffff;
        }
        .card-active-profile {
          border-width: 1.5px;
          box-shadow: 0 12px 36px -4px var(--profile-glow), var(--specular-rim);
        }
        .active-badge-pill {
          position: absolute;
          top: 1rem;
          left: 1rem;
          font-size: 0.68rem;
          font-weight: 800;
          color: #ffffff;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .quick-edit-trigger {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid var(--border-glass-subtle);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-edit-trigger:hover {
          color: var(--text-primary);
          background: rgba(15, 23, 42, 0.08);
        }
        .monogram-avatar-large {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 2rem;
          color: #ffffff;
          margin-bottom: 1rem;
          transition: transform 0.25s ease;
        }
        .netflix-profile-card:hover .monogram-avatar-large {
          transform: scale(1.06);
        }
        .profile-display-name {
          font-size: 1.3rem;
          margin-bottom: 0.2rem;
        }
        .profile-role-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 0.85rem;
        }
        .profile-stats-token {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: #f1f5f9;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          margin-bottom: 1rem;
        }
        .dot {
          color: var(--text-muted);
        }
        .profile-bio-snippet {
          font-size: 0.825rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 1.5rem;
          flex: 1;
        }
        .select-profile-cta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .profile-edit-stack {
          max-width: 460px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .edit-box-title {
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }
        .edit-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: left;
        }
        .edit-field label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .edit-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
        }
        .textarea-tall {
          resize: none;
        }
        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};
