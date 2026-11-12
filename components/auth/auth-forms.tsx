'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Building2, Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      window.location.assign(json.data.redirectTo || '/organizer/dashboard');
    } catch {
      setError('Network error while signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!supabaseConfigured && (
        <Alert tone="warning" title="Authentication Configuration Pending">
          Live authentication requires workspace environment variables to be configured.
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
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading || !supabaseConfigured}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In to Workspace'
        )}
      </Button>

      <p className="pt-1 text-center text-xs text-stone-600">
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
  const [role, setRole] = useState<'organizer' | 'sponsor'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      window.location.assign(json.data?.redirectTo || '/onboarding');
    } catch {
      setError('Network error while creating your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!supabaseConfigured && (
        <Alert tone="warning" title="Authentication Configuration Pending">
          Configure workspace authentication keys before registering accounts.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {infoMessage && <Alert tone="success">{infoMessage}</Alert>}

      <div>
        <Label>Select Your Role</Label>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-[#f0eee7] p-1.5">
          {[
            {
              id: 'organizer' as const,
              title: 'Organizer',
              sub: 'Student society',
              icon: GraduationCap,
            },
            {
              id: 'sponsor' as const,
              title: 'Sponsor',
              sub: 'Brand partner',
              icon: Building2,
            },
          ].map((item) => {
            const active = role === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={cn(
                  'relative flex flex-col items-start rounded-xl p-3 text-left transition-colors cursor-pointer',
                  active ? 'text-[#0c121e]' : 'text-stone-600 hover:text-[#0c121e]'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="auth-role-toggle"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl border border-emerald-600/35 bg-white shadow-xs"
                  />
                )}
                <span className="relative z-10 flex w-full flex-col">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-emerald-700' : 'text-stone-500'
                    )}
                  />
                  <span className="mt-2 font-display text-xs font-bold">{item.title}</span>
                  <span className="mt-0.5 text-xs text-stone-600">{item.sub}</span>
                </span>
              </button>
            );
          })}
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
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Create a strong password"
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading || !supabaseConfigured}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          `Continue as ${role === 'organizer' ? 'Organizer' : 'Sponsor'}`
        )}
      </Button>

      <p className="pt-1 text-center text-xs text-stone-600">
        Already registered?{' '}
        <Link href="/auth/sign-in" className="font-semibold text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
