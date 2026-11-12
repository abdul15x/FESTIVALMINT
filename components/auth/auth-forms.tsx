'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function SignInForm({
  supabaseConfigured,
  initialError,
}: {
  supabaseConfigured: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === 'suspended'
      ? 'Your account has been suspended by an administrator.'
      : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Sign in failed. Please check your credentials.');
        return;
      }
      router.push(json.data.redirectTo || '/organizer/dashboard');
      router.refresh();
    } catch {
      setError('Network error while signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!supabaseConfigured && (
        <Alert tone="warning" title="Supabase Configuration Pending">
          Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
          <code className="font-mono text-xs">.env.local</code> to enable live authentication.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      <div>
        <Label htmlFor="signin-email">Email Address</Label>
        <Input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <p className="text-center text-xs text-slate-600">
        New to FESTIVALMINT AI?{' '}
        <Link href="/auth/sign-up" className="font-semibold text-emerald-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({
  defaultRole = 'organizer',
  supabaseConfigured,
}: {
  defaultRole?: 'organizer' | 'sponsor';
  supabaseConfigured: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<'organizer' | 'sponsor'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Registration failed.');
        return;
      }

      if (json.data?.requiresEmailConfirmation) {
        setInfoMessage(json.message);
        return;
      }

      router.push(json.data?.redirectTo || '/onboarding');
      router.refresh();
    } catch {
      setError('Network error while creating your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!supabaseConfigured && (
        <Alert tone="warning" title="Supabase Configuration Pending">
          Configure Supabase keys in <code className="font-mono text-xs">.env.local</code> before
          registering accounts.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {infoMessage && <Alert tone="success">{infoMessage}</Alert>}

      <div>
        <Label>Select Your Role</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('organizer')}
            className={cn(
              'flex flex-col items-start rounded-xl border p-3 text-left transition-colors cursor-pointer',
              role === 'organizer'
                ? 'border-emerald-600 bg-emerald-50/70 text-slate-950'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <GraduationCap className="h-4 w-4 text-emerald-700" />
            <span className="mt-2 text-xs font-bold">Organizer</span>
            <span className="mt-0.5 text-[11px] text-slate-500">University society / event</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('sponsor')}
            className={cn(
              'flex flex-col items-start rounded-xl border p-3 text-left transition-colors cursor-pointer',
              role === 'sponsor'
                ? 'border-emerald-600 bg-emerald-50/70 text-slate-950'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <Building2 className="h-4 w-4 text-emerald-700" />
            <span className="mt-2 text-xs font-bold">Sponsor</span>
            <span className="mt-0.5 text-[11px] text-slate-500">Company / brand partner</span>
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          required
          minLength={2}
          placeholder="Amina Tariq"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signup-email">Work or University Email</Label>
        <Input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signup-password">Password (min 8 characters)</Label>
        <Input
          id="signup-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          `Continue as ${role === 'organizer' ? 'Organizer' : 'Sponsor'}`
        )}
      </Button>

      <p className="text-center text-xs text-slate-600">
        Already registered?{' '}
        <Link href="/auth/sign-in" className="font-semibold text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
