import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { PrimaryUserData } from './StepAccountDetails';
import { PartnerUserData } from './StepPartnerDetails';
import { ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';

interface StepPairConfirmationProps {
  primary: PrimaryUserData;
  partner: PartnerUserData;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function StepPairConfirmation({
  primary,
  partner,
  isSubmitting,
  onBack,
  onSubmit,
}: StepPairConfirmationProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Review Duo Station Configuration
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Both profiles will be linked in the fitness database for synchronized tracking.
        </p>
      </div>

      {/* Side-by-side Duo Profile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Partner 1 Card */}
        <Card variant="glass" className="p-5 text-left border-2 border-sky-400/40 dark:border-sky-500/40 relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3">
            <Avatar name={primary.name} emoji={primary.emoji} role="person_1" size="lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="azure" size="sm">Primary</Badge>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {primary.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                @{primary.username}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>Gender: <span className="font-semibold">{primary.gender}</span></div>
            <div>Age: <span className="font-semibold">{primary.age} yrs</span></div>
            <div>Focus: <span className="font-semibold">{primary.bio || 'Strength & Hypertrophy'}</span></div>
          </div>
        </Card>

        {/* Partner 2 Card */}
        <Card variant="glass" className="p-5 text-left border-2 border-rose-400/40 dark:border-rose-500/40 relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3">
            <Avatar name={partner.name} emoji={partner.emoji} role="person_2" size="lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="rose" size="sm">Partner</Badge>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {partner.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                @{partner.username}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>Gender: <span className="font-semibold">{partner.gender}</span></div>
            <div>Age: <span className="font-semibold">{partner.age} yrs</span></div>
            <div>Focus: <span className="font-semibold">{partner.bio || 'Tone & Conditioning'}</span></div>
          </div>
        </Card>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 text-xs text-left text-slate-600 dark:text-slate-300">
        <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Ready for Synchronized Training</p>
          <p className="mt-0.5">
            Both partners can log in separately using their usernames to view workouts, record weights & reps, and synchronize rest timers.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
          leftIcon={<ArrowLeft size={18} />}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          onClick={onSubmit}
          rightIcon={<Sparkles size={18} />}
          className="flex-1"
        >
          Initialize Duo Station 🚀
        </Button>
      </div>
    </div>
  );
}
