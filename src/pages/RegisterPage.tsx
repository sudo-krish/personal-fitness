import { useState, type FormEvent } from 'react';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, AlertCircle, Sun, Moon, Users } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    sessionStorage.setItem('duo_reg_p1_username', cleanUsername);
    sessionStorage.setItem('duo_reg_p1_password', password);

    onNavigate('/initiation');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#090D16] transition-colors relative">
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
          aria-label="Toggle color theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-4 animate-in fade-in duration-300">
            <Users size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Register Duo Pair
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Create your primary account and pair with your workout partner.
          </p>
        </div>

        <Card variant="glass" className="w-full text-left p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">Validation Error</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleNext} className="flex flex-col gap-4">
            <Input
              label="Your Username (Primary User)"
              type="text"
              autoComplete="username"
              placeholder="e.g. alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<User size={16} />}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
            >
              Continue to Partner Setup →
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
            >
              Sign In to Existing Duo →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
