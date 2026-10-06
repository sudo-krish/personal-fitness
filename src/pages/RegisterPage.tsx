import { useState, type FormEvent } from 'react';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UnderlineField } from '../components/ui/UnderlineField';
import { ArchFrame } from '../components/art/ArchFrame';
import { Swash } from '../components/art/Swash';
import { Contours } from '../components/art/Contours';
import { AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
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
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-5 relative overflow-hidden animate-rise">
      <Contours seed="register" lines={6} drift className="text-ink/5" />

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
            Start <Swash>together</Swash>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Create your primary login credentials and begin duo setup.
          </p>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-p2-tint/60 text-clay text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM CARD */}
        <Card variant="plain" className="w-full p-6 sm:p-8 shadow-card">
          <form onSubmit={handleNext} className="flex flex-col gap-5">
            <UnderlineField
              label="Primary Username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <UnderlineField
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <UnderlineField
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="md" className="w-full mt-2">
              Continue to Athlete Profiles →
            </Button>
          </form>

          {/* SIGN IN LINK */}
          <div className="mt-6 pt-5 border-t border-hairline text-center">
            <p className="text-xs text-ink-muted">
              Already have a paired duo?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-semibold text-sage-700 hover:underline cursor-pointer"
              >
                Sign in here →
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
