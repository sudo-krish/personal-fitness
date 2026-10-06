import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { User, Lock, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export interface PartnerUserData {
  username: string;
  password: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  stats: string;
  bio: string;
  emoji: string;
  color: string;
}

interface StepPartnerDetailsProps {
  data: PartnerUserData;
  primaryUsername: string;
  onChange: (updates: Partial<PartnerUserData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const EMOJI_OPTIONS = ['✨', '🌸', '💫', '🦊', '🌺', '💎', '🦄', '🏋️‍♀️'];

export function StepPartnerDetails({
  data,
  primaryUsername,
  onChange,
  onBack,
  onNext,
}: StepPartnerDetailsProps) {
  const isFormValid =
    data.username.trim().length >= 3 &&
    data.username.trim().toLowerCase() !== primaryUsername.trim().toLowerCase() &&
    data.password.length >= 6 &&
    data.name.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Live Preview Card */}
      <Card variant="subtle" className="flex items-center gap-4 p-4 border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20">
        <Avatar name={data.name || 'Partner'} emoji={data.emoji} role="person_2" size="lg" />
        <div className="text-left flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Duo Partner
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {data.name || "Partner's Name"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            @{data.username || 'partner_user'} • {data.gender}, {data.age} yrs
          </p>
        </div>
      </Card>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Partner's Display Name"
          placeholder="e.g. Jordan Lee"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          leftIcon={<Sparkles size={16} />}
          required
        />

        <Input
          label="Partner's Username"
          placeholder="e.g. jordan"
          value={data.username}
          onChange={(e) => onChange({ username: e.target.value.toLowerCase() })}
          leftIcon={<User size={16} />}
          error={
            data.username.trim() && data.username.trim().toLowerCase() === primaryUsername.trim().toLowerCase()
              ? 'Must be different from your username'
              : undefined
          }
          required
        />

        <Input
          label="Temporary Password for Partner"
          type="password"
          placeholder="At least 6 characters"
          value={data.password}
          onChange={(e) => onChange({ password: e.target.value })}
          leftIcon={<Lock size={16} />}
          helperText="Your partner can change this later"
          required
        />

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Gender
            </label>
            <select
              value={data.gender}
              onChange={(e) =>
                onChange({ gender: e.target.value as 'Male' | 'Female' | 'Other' })
              }
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="w-24">
            <Input
              label="Age"
              type="number"
              min={12}
              max={100}
              value={data.age}
              onChange={(e) => onChange({ age: Number(e.target.value) || 26 })}
            />
          </div>
        </div>
      </div>

      {/* Avatar Emoji Selector */}
      <div className="flex flex-col gap-2 text-left">
        <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
          Choose Partner Avatar Emoji
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ emoji })}
              className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                data.emoji === emoji
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          leftIcon={<ArrowLeft size={18} />}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!isFormValid}
          onClick={onNext}
          rightIcon={<ArrowRight size={18} />}
          className="flex-1"
        >
          Review Pair →
        </Button>
      </div>
    </div>
  );
}
