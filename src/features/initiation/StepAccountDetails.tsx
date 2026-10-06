import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { User, Lock, Sparkles, ArrowRight } from 'lucide-react';

export interface PrimaryUserData {
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

interface StepAccountDetailsProps {
  data: PrimaryUserData;
  onChange: (updates: Partial<PrimaryUserData>) => void;
  onNext: () => void;
}

const EMOJI_OPTIONS = ['⚡', '🦁', '🔥', '🦾', '🦅', '👑', '🐺', '🏋️‍♂️'];

export function StepAccountDetails({ data, onChange, onNext }: StepAccountDetailsProps) {
  const isFormValid =
    data.username.trim().length >= 3 &&
    data.password.length >= 6 &&
    data.name.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Live Preview Card */}
      <Card variant="subtle" className="flex items-center gap-4 p-4 border border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20">
        <Avatar name={data.name || 'You'} emoji={data.emoji} role="person_1" size="lg" />
        <div className="text-left flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Primary Partner (You)
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {data.name || 'Your Name'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            @{data.username || 'username'} • {data.gender}, {data.age} yrs
          </p>
        </div>
      </Card>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Your Display Name"
          placeholder="e.g. Alex Rivera"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          leftIcon={<Sparkles size={16} />}
          required
        />

        <Input
          label="Your Username"
          placeholder="e.g. alex"
          value={data.username}
          onChange={(e) => onChange({ username: e.target.value.toLowerCase() })}
          leftIcon={<User size={16} />}
          required
        />

        <Input
          label="Your Password"
          type="password"
          placeholder="At least 6 characters"
          value={data.password}
          onChange={(e) => onChange({ password: e.target.value })}
          leftIcon={<Lock size={16} />}
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
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
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
              onChange={(e) => onChange({ age: Number(e.target.value) || 28 })}
            />
          </div>
        </div>
      </div>

      {/* Avatar Emoji Selector */}
      <div className="flex flex-col gap-2 text-left">
        <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
          Choose Avatar Emoji
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ emoji })}
              className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                data.emoji === emoji
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        disabled={!isFormValid}
        onClick={onNext}
        rightIcon={<ArrowRight size={18} />}
        className="w-full mt-2"
      >
        Next: Partner Details →
      </Button>
    </div>
  );
}
