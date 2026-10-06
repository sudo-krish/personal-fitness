import { useState } from 'react';
import { UserProfile } from '../types/workout';
import { StorageService } from '../services/storageService';
import { haptics } from '../lib/haptics';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UnderlineField } from '../components/ui/UnderlineField';
import { Segmented } from '../components/ui/Segmented';
import { ArchFrame } from '../components/art/ArchFrame';
import { Swash } from '../components/art/Swash';
import { Contours } from '../components/art/Contours';
import { AlertCircle } from 'lucide-react';

interface InitiationPageProps {
  initialProfiles?: UserProfile[];
  onComplete: (profiles: UserProfile[]) => void;
  onNavigate?: (route: AppRoute) => void;
}

export function InitiationPage({
  initialProfiles,
  onComplete,
  onNavigate,
}: InitiationPageProps) {
  const { registerDuo } = useAuth();

  const p1Default = initialProfiles?.find((p) => p.id === 'person_1');
  const p2Default = initialProfiles?.find((p) => p.id === 'person_2');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [p1Username, setP1Username] = useState(
    sessionStorage.getItem('duo_reg_p1_username') || p1Default?.username || ''
  );
  const [p1Password, setP1Password] = useState(
    sessionStorage.getItem('duo_reg_p1_password') || ''
  );
  const [p1Name, setP1Name] = useState(p1Default?.name && p1Default.name !== 'Partner 1' ? p1Default.name : '');
  const [p1Age, setP1Age] = useState(p1Default?.age || 28);
  const [p1Gender, setP1Gender] = useState<'Male' | 'Female' | 'Other'>(
    (p1Default?.gender as 'Male' | 'Female' | 'Other') || 'Male'
  );
  const [p1Goal, setP1Goal] = useState(p1Default?.stats || 'Hypertrophy & Strength');

  const [p2Username, setP2Username] = useState(p2Default?.username || '');
  const [p2Password, setP2Password] = useState('');
  const [p2Name, setP2Name] = useState(p2Default?.name && p2Default.name !== 'Partner 2' ? p2Default.name : '');
  const [p2Age, setP2Age] = useState(p2Default?.age || 26);
  const [p2Gender, setP2Gender] = useState<'Male' | 'Female' | 'Other'>(
    (p2Default?.gender as 'Male' | 'Female' | 'Other') || 'Female'
  );
  const [p2Goal, setP2Goal] = useState(p2Default?.stats || 'Tone & Mobility');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = () => {
    haptics.tap();
    setErrorMessage(null);
    if (step === 1) {
      if (!p1Name.trim()) {
        setErrorMessage('Please enter your name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!p2Name.trim()) {
        setErrorMessage("Please enter your partner's name.");
        return;
      }
      if (!p2Username.trim() || !p2Password.trim()) {
        setErrorMessage("Please set a username and password for your partner's login.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    haptics.success();
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanP1User = p1Username.trim().toLowerCase();
    const cleanP2User = p2Username.trim().toLowerCase();
    const cleanP1Name = p1Name.trim();
    const cleanP2Name = p2Name.trim();

    try {
      const regRes = await registerDuo({
        primary: {
          username: cleanP1User,
          password: p1Password,
          name: cleanP1Name,
          gender: p1Gender,
          age: p1Age,
          title: `${cleanP1Name} (${p1Gender}, ${p1Age})`,
          stats: p1Goal,
          bio: 'Strength & progressive overload',
          avatarEmoji: cleanP1Name.charAt(0).toUpperCase() || '1',
          themeColor: '#3d6b7d',
        },
        partner: {
          username: cleanP2User,
          password: p2Password,
          name: cleanP2Name,
          gender: p2Gender,
          age: p2Age,
          title: `${cleanP2Name} (${p2Gender}, ${p2Age})`,
          stats: p2Goal,
          bio: 'Tone, posture & mobility',
          avatarEmoji: cleanP2Name.charAt(0).toUpperCase() || '2',
          themeColor: '#9a5b4b',
        },
      });

      if (!regRes.success) {
        setErrorMessage(regRes.error || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      sessionStorage.removeItem('duo_reg_p1_username');
      sessionStorage.removeItem('duo_reg_p1_password');

      const savedProfiles: UserProfile[] = [
        {
          id: 'person_1',
          name: cleanP1Name,
          title: `${cleanP1Name} (${p1Gender}, ${p1Age})`,
          gender: p1Gender,
          age: p1Age,
          stats: p1Goal,
          bio: 'Strength & progressive overload',
          avatarEmoji: cleanP1Name.charAt(0).toUpperCase() || '1',
          themeColor: '#3d6b7d',
          username: cleanP1User,
          isPrimary: true,
        },
        {
          id: 'person_2',
          name: cleanP2Name,
          title: `${cleanP2Name} (${p2Gender}, ${p2Age})`,
          gender: p2Gender,
          age: p2Age,
          stats: p2Goal,
          bio: 'Tone, posture & mobility',
          avatarEmoji: cleanP2Name.charAt(0).toUpperCase() || '2',
          themeColor: '#9a5b4b',
          username: cleanP2User,
          isPrimary: false,
        },
      ];

      StorageService.saveProfiles(savedProfiles);
      StorageService.setActiveProfileId('person_1');

      onComplete(savedProfiles);
      if (onNavigate) {
        onNavigate('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize duo account.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-5 relative overflow-hidden animate-rise">
      <Contours seed="initiation" lines={6} drift className="text-ink/5" />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* ARCH PHOTO FRAME */}
        <div className="mb-6 flex justify-center">
          {step === 1 && (
            <ArchFrame
              src="/assets/initiation/male-workout.jpg"
              alt="You"
              className="w-36 h-48 shadow-card"
            />
          )}
          {step === 2 && (
            <ArchFrame
              src="/assets/initiation/female-workout.jpg"
              alt="Partner"
              className="w-36 h-48 shadow-card"
            />
          )}
          {step === 3 && (
            <div className="flex items-center -space-x-8">
              <ArchFrame
                src="/assets/initiation/male-workout.jpg"
                alt="You"
                tilt={-4}
                className="w-32 h-44 shadow-card"
              />
              <ArchFrame
                src="/assets/initiation/female-workout.jpg"
                alt="Partner"
                tilt={4}
                className="w-32 h-44 shadow-card"
              />
            </div>
          )}
        </div>

        {/* 3-STEP PROGRESS LINES */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`h-1 rounded-full transition-all duration-300 ${step === 1 ? 'w-10 bg-sage-500' : 'w-4 bg-ink/15'}`} />
          <span className={`h-1 rounded-full transition-all duration-300 ${step === 2 ? 'w-10 bg-sage-500' : 'w-4 bg-ink/15'}`} />
          <span className={`h-1 rounded-full transition-all duration-300 ${step === 3 ? 'w-10 bg-sage-500' : 'w-4 bg-ink/15'}`} />
        </div>

        {/* HEADLINE */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-medium text-ink leading-tight">
            {step === 1 && <>About <Swash>you</Swash></>}
            {step === 2 && <>Your <Swash>partner</Swash></>}
            {step === 3 && <>Train <Swash>together</Swash></>}
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {step === 1 && "Let's calibrate your profile and training focus."}
            {step === 2 && "Configure login details for your training partner."}
            {step === 3 && "Review your paired duo before entering your first session."}
          </p>
        </div>

        {/* ERROR NOTICE */}
        {errorMessage && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-p2-tint/60 text-clay text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP FORM */}
        <Card variant="plain" className="w-full p-6 shadow-card flex flex-col gap-5">
          {step === 1 && (
            <>
              <UnderlineField
                label="Full Name"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                autoFocus
              />
              <UnderlineField
                label="Age"
                type="number"
                value={p1Age}
                onChange={(e) => setP1Age(Number(e.target.value))}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Gender</span>
                <Segmented
                  label="Gender"
                  value={p1Gender}
                  onChange={setP1Gender}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>
              {!sessionStorage.getItem('duo_reg_p1_username') && (
                <>
                  <UnderlineField
                    label="Username"
                    value={p1Username}
                    onChange={(e) => setP1Username(e.target.value)}
                  />
                  <UnderlineField
                    label="Password"
                    type="password"
                    value={p1Password}
                    onChange={(e) => setP1Password(e.target.value)}
                  />
                </>
              )}
              <UnderlineField
                label="Target Split / Goal"
                value={p1Goal}
                onChange={(e) => setP1Goal(e.target.value)}
              />
              <Button variant="primary" onClick={handleNext} className="w-full mt-2">
                Continue to Partner Setup →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <UnderlineField
                label="Partner's Full Name"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                autoFocus
              />
              <UnderlineField
                label="Partner Username (for login)"
                value={p2Username}
                onChange={(e) => setP2Username(e.target.value)}
              />
              <UnderlineField
                label="Partner Password"
                type="password"
                value={p2Password}
                onChange={(e) => setP2Password(e.target.value)}
              />
              <UnderlineField
                label="Partner Age"
                type="number"
                value={p2Age}
                onChange={(e) => setP2Age(Number(e.target.value))}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Gender</span>
                <Segmented
                  label="Gender"
                  value={p2Gender}
                  onChange={setP2Gender}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>
              <UnderlineField
                label="Partner Goal / Focus"
                value={p2Goal}
                onChange={(e) => setP2Goal(e.target.value)}
              />
              <div className="flex items-center gap-2 pt-2">
                <Button variant="glass" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button variant="primary" onClick={handleNext} className="flex-1">
                  Review Duo →
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-2xl bg-p1-tint/40 border border-p1-ink/20 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-p1-ink">Primary</span>
                  <h4 className="text-sm font-semibold text-ink">{p1Name}</h4>
                  <p className="text-xs text-ink-muted">{p1Age} • {p1Gender}</p>
                  <p className="text-xs text-sage-700 font-medium">{p1Goal}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-p2-tint/40 border border-p2-ink/20 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-p2-ink">Partner</span>
                  <h4 className="text-sm font-semibold text-ink">{p2Name}</h4>
                  <p className="text-xs text-ink-muted">{p2Age} • {p2Gender}</p>
                  <p className="text-xs text-sage-700 font-medium">{p2Goal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="glass" onClick={() => setStep(2)} className="flex-1">
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  Begin Training ➔
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
