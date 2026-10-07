import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../router/routes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UnderlineField } from '../components/ui/UnderlineField';
import { AuthShell } from '../components/shell/AuthShell';
import { Swash } from '../components/art/Swash';
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
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'idle_timeout') {
      setIdleNotice('You were signed out after 30 minutes of inactivity.');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      username: username.trim() ? undefined : 'Enter your username',
      password: password.trim() ? undefined : 'Enter your password',
    };
    setFieldErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) return;

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
    <AuthShell>
      <div className="flex flex-col">
        {/* HEADLINE */}
        <div className="mb-6">
          <h1 className="font-display text-4xl font-medium text-ink leading-tight">
            Welcome <Swash>back</Swash>
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">Pick up where the two of you left off.</p>
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
        <Card variant="plain" className="w-full p-6 sm:p-8 shadow-float glass-strong">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <UnderlineField
              label="Username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) setFieldErrors((f) => ({ ...f, username: undefined }));
              }}
              error={fieldErrors.username}
              disabled={loading}
              required
              autoFocus
            />

            <UnderlineField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
              }}
              error={fieldErrors.password}
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
              Sign in
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
    </AuthShell>
  );
}
