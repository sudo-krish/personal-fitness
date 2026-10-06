import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UnderlineField } from '../components/ui/UnderlineField';
import { ArchFrame } from '../components/art/ArchFrame';
import { Swash } from '../components/art/Swash';
import { Contours } from '../components/art/Contours';
import { AlertCircle, Clock } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth();

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
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-5 relative overflow-hidden animate-rise">
      <Contours seed="login" lines={6} drift className="text-ink/5" />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* ARCH PHOTO FRAME */}
        <div className="mb-6 flex justify-center">
          <ArchFrame
            src="/assets/partner-training.jpg"
            alt="Duo Training"
            className="w-36 h-48 shadow-card"
          />
        </div>

        {/* HEADLINE */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-medium text-ink leading-tight">
            Welcome <Swash>back</Swash>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Sign in to continue your synchronized partner workouts.
          </p>
        </div>

        {/* TIMEOUT NOTICE */}
        {idleNotice && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-butter/60 border border-ink/10 text-ink text-xs flex items-center gap-2">
            <Clock size={15} className="shrink-0 text-sage-700" />
            <span>{idleNotice}</span>
          </div>
        )}

        {/* ERROR NOTICE */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-p2-tint/60 text-clay text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM CARD */}
        <Card variant="plain" className="w-full p-6 sm:p-8 shadow-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <UnderlineField
              label="Username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />

            <UnderlineField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In to Session
            </Button>
          </form>

          {/* REGISTER LINK */}
          <div className="mt-6 pt-5 border-t border-hairline text-center">
            <p className="text-xs text-ink-muted">
              First time training together?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="font-semibold text-sage-700 hover:underline cursor-pointer"
              >
                Create a duo →
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
