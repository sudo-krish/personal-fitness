import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { UnderlineField } from '../components/ui/UnderlineField';
import { Segmented } from '../components/ui/Segmented';
import { UserProfile } from '../types/workout';
import { PlanService } from '../services/planService';
import { haptics } from '../lib/haptics';
import { RefreshCw, LogOut, Sparkles } from 'lucide-react';

export function SettingsPage() {
  const { user, partner, logout, refreshSession } = useAuth();
  const isPrimary = user?.isPrimary ?? true;

  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(28);
  const [editGender, setEditGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editStats, setEditStats] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showReloadSheet, setShowReloadSheet] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const p1 = isPrimary ? user : partner;
  const p2 = isPrimary ? partner : user;

  const openEditSheet = (profile: UserProfile | null) => {
    if (!profile) return;
    haptics.tap();
    setEditingProfile(profile);
    setEditName(profile.name);
    setEditAge(profile.age);
    setEditGender((profile.gender as 'Male' | 'Female' | 'Other') || 'Male');
    setEditStats(profile.stats || '');
    setEditBio(profile.bio || '');
  };

  const handleSaveProfile = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/profiles/${editingProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          age: Number(editAge),
          gender: editGender,
          stats: editStats,
          bio: editBio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        haptics.success();
        await refreshSession();
        setEditingProfile(null);
        setStatusNotice('Profile updated successfully');
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadPlan = async () => {
    setIsReloading(true);
    await PlanService.seedPreWorkoutPlan(true);
    setIsReloading(false);
    setShowReloadSheet(false);
    haptics.celebration();
    setStatusNotice('Curated 5-Day routine reloaded');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div className="w-full max-w-[560px] mx-auto px-5 pt-6 pb-36 animate-rise flex flex-col gap-6">
      {statusNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-strong text-ink px-4 py-2 rounded-full shadow-float text-xs font-semibold flex items-center gap-2 animate-rise">
          <Sparkles className="size-3.5 text-sage-500" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ST1: PROFILE PAIR CARDS */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 block mb-2.5">
          Duo Athletes
        </span>
        <div className="grid grid-cols-2 gap-3.5">
          {/* You */}
          <Card variant="plain" className="p-4 flex flex-col items-center text-center gap-2.5">
            <div className="relative size-16 rounded-t-full rounded-b-2xl bg-p1-tint text-p1-ink flex items-center justify-center font-display text-xl font-bold border border-ink/10 shadow-xs">
              <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-t-full rounded-b-2xl border border-ink/15 -z-10" />
              {p1?.name.slice(0, 2).toUpperCase() || 'P1'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink leading-tight">{p1?.name || 'Primary'}</h3>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {p1?.age} • {p1?.gender}
              </p>
              <p className="text-[11px] text-sage-700 font-medium truncate max-w-[120px] mt-0.5">
                {p1?.stats || '5-Day Hypertrophy'}
              </p>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => openEditSheet(p1 || null)}
              className="w-full mt-1"
            >
              Edit Profile
            </Button>
          </Card>

          {/* Partner */}
          <Card variant="plain" className="p-4 flex flex-col items-center text-center gap-2.5">
            <div className="relative size-16 rounded-t-full rounded-b-2xl bg-p2-tint text-p2-ink flex items-center justify-center font-display text-xl font-bold border border-ink/10 shadow-xs">
              <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-t-full rounded-b-2xl border border-ink/15 -z-10" />
              {p2?.name.slice(0, 2).toUpperCase() || 'P2'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink leading-tight">{p2?.name || 'Partner'}</h3>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {p2?.age} • {p2?.gender}
              </p>
              <p className="text-[11px] text-sage-700 font-medium truncate max-w-[120px] mt-0.5">
                {p2?.stats || 'Tone & Strength'}
              </p>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => openEditSheet(p2 || null)}
              className="w-full mt-1"
            >
              Edit Profile
            </Button>
          </Card>
        </div>
      </div>

      {/* ST3: GROUPED SECTIONS */}

      {/* PLAN SECTION */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 block mb-2">
          Workout Plan
        </span>
        <Card variant="plain" className="overflow-hidden divide-y divide-hairline">
          <button
            type="button"
            onClick={() => setShowReloadSheet(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-sunk transition-colors cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-semibold text-ink">Reload 5-Day Duo Routine</h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Reseed supersets and target reps for both partners
              </p>
            </div>
            <RefreshCw size={16} className="text-ink-muted" />
          </button>
        </Card>
      </div>

      {/* ACCOUNT SECTION */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 block mb-2">
          Session & Account
        </span>
        <Card variant="plain" className="overflow-hidden divide-y divide-hairline">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-p2-tint/40 transition-colors cursor-pointer text-clay"
          >
            <div>
              <h4 className="text-sm font-semibold">Sign Out</h4>
              <p className="text-xs text-ink-muted mt-0.5">End active training session</p>
            </div>
            <LogOut size={16} />
          </button>
        </Card>
      </div>

      {/* ST2: EDIT PROFILE BOTTOM SHEET */}
      <Sheet
        isOpen={Boolean(editingProfile)}
        onClose={() => setEditingProfile(null)}
        title={`Edit ${editingProfile?.name || 'Profile'}`}
      >
        <div className="flex flex-col gap-5 pt-3">
          <UnderlineField
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <UnderlineField
            label="Age"
            type="number"
            value={editAge}
            onChange={(e) => setEditAge(Number(e.target.value))}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider text-[11px]">
              Gender
            </span>
            <Segmented
              label="Gender"
              value={editGender}
              onChange={setEditGender}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <UnderlineField
            label="Training Focus / Goal"
            value={editStats}
            onChange={(e) => setEditStats(e.target.value)}
          />

          <UnderlineField
            label="Bio Notes"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
          />

          <div className="pt-3">
            <Button
              variant="primary"
              isLoading={isSaving}
              onClick={handleSaveProfile}
              className="w-full"
            >
              Save Profile Changes
            </Button>
          </div>
        </div>
      </Sheet>

      {/* RELOAD CONFIRMATION SHEET */}
      <Sheet
        isOpen={showReloadSheet}
        onClose={() => setShowReloadSheet(false)}
        title="Reload 5-Day Routine?"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-ink-muted leading-relaxed">
            This will repopulate all 5 training days with the curated partner superset routine. Logged set history will be refreshed to clean targets.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="glass"
              onClick={() => setShowReloadSheet(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isReloading}
              onClick={handleReloadPlan}
              className="flex-1"
            >
              Confirm Reload
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
