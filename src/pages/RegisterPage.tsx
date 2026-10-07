import { useState, type FormEvent } from 'react';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UnderlineField } from '../components/ui/UnderlineField';
import { AuthShell } from '../components/shell/AuthShell';
import { Swash } from '../components/art/Swash';
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
    <AuthShell tagline="Build the plan once. Train it together.">
      <div className="flex flex-col">
        {/* HEADLINE */}
        <div className="mb-6">
          <h1 className="font-display text-4xl font-medium text-ink leading-tight">
            Start <Swash>together</Swash>
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">
            Create the shared login, then set up both athlete profiles.
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
        <Card variant="plain" className="w-full p-6 sm:p-8 shadow-float glass-strong">
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
              Continue to athlete profiles →
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
    </AuthShell>
  );
}
