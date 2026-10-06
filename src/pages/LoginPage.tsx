import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Lock, User, Clock, AlertCircle, Sun, Moon, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idleNotice, setIdleNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'idle_timeout') {
      setIdleNotice('You were signed out after 30 minutes of inactivity.');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide your username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setIdleNotice(null);

    const result = await login(username.trim(), password.trim());
    setLoading(false);

    if (result.success) {
      onNavigate('/');
    } else {
      setError(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#090D16] transition-colors relative">
      {/* Top Controls */}
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
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-4 animate-in fade-in duration-300">
            <Sparkles size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Duo Fitness
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Synchronized high-velocity workout tracking for training partners.
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="glass" className="w-full text-left p-6 sm:p-8 backdrop-blur-xl">
          {/* Idle Timeout Banner */}
          {idleNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <Clock size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold">Session Expired</p>
                <p className="mt-0.5 opacity-90">{idleNotice}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">Sign In Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Username"
              type="text"
              autoComplete="username"
              placeholder="e.g. alex or jordan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              leftIcon={<User size={16} />}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In to Station
            </Button>
          </form>

          {/* Onboarding Trigger */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              First time setting up your workout pair?
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/initiation')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
            >
              Create New Duo Pair →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
