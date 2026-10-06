import { useState } from 'react';
import { UserProfile } from '../types/workout';
import { StorageService } from '../services/storageService';
import { haptics } from '../lib/haptics';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { StepAccountDetails, PrimaryUserData } from '../features/initiation/StepAccountDetails';
import { StepPartnerDetails, PartnerUserData } from '../features/initiation/StepPartnerDetails';
import { StepPairConfirmation } from '../features/initiation/StepPairConfirmation';
import { Sun, Moon, AlertCircle, Users } from 'lucide-react';

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
  const { resolvedTheme, toggleTheme } = useTheme();

  const p1Default = initialProfiles?.find((p) => p.id === 'person_1');
  const p2Default = initialProfiles?.find((p) => p.id === 'person_2');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [primary, setPrimary] = useState<PrimaryUserData>({
    username: sessionStorage.getItem('duo_reg_p1_username') || p1Default?.username || '',
    password: sessionStorage.getItem('duo_reg_p1_password') || '',
    name: p1Default?.name && p1Default.name !== 'Partner 1' ? p1Default.name : '',
    gender: (p1Default?.gender as 'Male' | 'Female' | 'Other') || 'Male',
    age: p1Default?.age || 28,
    stats: p1Default?.stats || '5-Day Hypertrophy',
    bio: p1Default?.bio || 'Strength & progressive overload',
    emoji: p1Default?.avatarEmoji || '⚡',
    color: p1Default?.themeColor || '#0284c7',
  });

  const [partner, setPartner] = useState<PartnerUserData>({
    username: p2Default?.username || '',
    password: '',
    name: p2Default?.name && p2Default.name !== 'Partner 2' ? p2Default.name : '',
    gender: (p2Default?.gender as 'Male' | 'Female' | 'Other') || 'Female',
    age: p2Default?.age || 26,
    stats: p2Default?.stats || '5-Day Hypertrophy',
    bio: p2Default?.bio || 'Tone, posture & mobility',
    emoji: p2Default?.avatarEmoji || '✨',
    color: p2Default?.themeColor || '#e11d48',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    haptics.tap();
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanP1User = primary.username.trim().toLowerCase();
    const cleanP2User = partner.username.trim().toLowerCase();
    const cleanP1Name = primary.name.trim();
    const cleanP2Name = partner.name.trim();

    try {
      const regRes = await registerDuo({
        primary: {
          username: cleanP1User,
          password: primary.password,
          name: cleanP1Name,
          gender: primary.gender,
          age: primary.age,
          title: `${cleanP1Name} (${primary.gender}, ${primary.age})`,
          stats: primary.stats,
          bio: primary.bio,
          avatarEmoji: primary.emoji,
          themeColor: primary.color,
        },
        partner: {
          username: cleanP2User,
          password: partner.password,
          name: cleanP2Name,
          gender: partner.gender,
          age: partner.age,
          title: `${cleanP2Name} (${partner.gender}, ${partner.age})`,
          stats: partner.stats,
          bio: partner.bio,
          avatarEmoji: partner.emoji,
          themeColor: partner.color,
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
          title: `${cleanP1Name} (${primary.gender}, ${primary.age})`,
          gender: primary.gender,
          age: primary.age,
          stats: primary.stats,
          bio: primary.bio,
          avatarEmoji: primary.emoji,
          themeColor: primary.color,
          username: cleanP1User,
          isPrimary: true,
        },
        {
          id: 'person_2',
          name: cleanP2Name,
          title: `${cleanP2Name} (${partner.gender}, ${partner.age})`,
          gender: partner.gender,
          age: partner.age,
          stats: partner.stats,
          bio: partner.bio,
          avatarEmoji: partner.emoji,
          themeColor: partner.color,
          username: cleanP2User,
          isPrimary: false,
        },
      ];

      StorageService.saveProfiles(savedProfiles);
      StorageService.setActiveProfileId('person_1');

      haptics.success();
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#090D16] transition-colors relative">
      {/* Top Header */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
          aria-label="Toggle color theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-xl flex flex-col items-center text-center my-8">
        {/* Step Indicator */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-3">
            <Users size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Duo Station Initiation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Step {step} of 3: {step === 1 ? 'Your Account' : step === 2 ? 'Partner Account' : 'Duo Review'}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= 1 ? 'w-8 bg-sky-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= 2 ? 'w-8 bg-rose-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= 3 ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Form Container Card */}
        <Card variant="glass" className="w-full p-6 sm:p-8 backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs text-left">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">Setup Error</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <StepAccountDetails
              data={primary}
              onChange={(updates) => setPrimary((prev) => ({ ...prev, ...updates }))}
              onNext={() => {
                haptics.tap();
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <StepPartnerDetails
              data={partner}
              primaryUsername={primary.username}
              onChange={(updates) => setPartner((prev) => ({ ...prev, ...updates }))}
              onBack={() => {
                haptics.tap();
                setStep(1);
              }}
              onNext={() => {
                haptics.tap();
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <StepPairConfirmation
              primary={primary}
              partner={partner}
              isSubmitting={isSubmitting}
              onBack={() => {
                haptics.tap();
                setStep(2);
              }}
              onSubmit={handleSubmit}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
