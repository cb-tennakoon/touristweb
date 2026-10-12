'use client'

import { useMemo, useState } from 'react'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  EDIT THESE FOR YOUR CUSTOMER                                       */
/* ------------------------------------------------------------------ */
const SITE_NAME = 'TouristWeb'
const SITE_TAGLINE = 'Your personal space to write and publish.'

// Optional: only this email may register (leave '' to allow any email).
// NOTE: this is a client-side check only. To truly lock registration,
// also disable public sign-ups in Supabase (Auth > Providers > Email).
const ALLOWED_EMAIL: string = ''
/* ------------------------------------------------------------------ */

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

/* ----------------------------- helpers ----------------------------- */

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function getStrength(pw: string) {
  if (pw.length === 0) return { score: 0, label: '' }
  if (pw.length < 6) return { score: 1, label: 'Too short' }
  let score = 1
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)] }
}

const strengthColors = [
  'bg-gray-200',
  'bg-rose-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
]

/* ------------------------------ icons ------------------------------ */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const UserIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)
const MailIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)
const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
const PenIcon = () => (
  <svg {...iconProps} width={22} height={22}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)
const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg {...iconProps}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)
const CheckIcon = () => (
  <svg {...iconProps} width={16} height={16} strokeWidth={2.4}>
    <path d="m5 12 5 5 9-10" />
  </svg>
)
const AlertIcon = () => (
  <svg {...iconProps} width={16} height={16}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </svg>
)
const Spinner = () => (
  <svg
    className="h-5 w-5 animate-spin motion-reduce:animate-none"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

/* ---------------------------- field shell --------------------------- */

function Field({
  id,
  label,
  icon,
  right,
  hint,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  right?: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#3B4BFF]">
          {icon}
        </span>
        {children}
        {right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {hint}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-[15px] text-slate-900 ' +
  'placeholder:text-slate-400 outline-none transition ' +
  'focus:border-[#3B4BFF] focus:ring-4 focus:ring-[#3B4BFF]/15'

/* ------------------------------- page ------------------------------- */

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const strength = useMemo(() => getStrength(password), [password])
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword
  const matches = confirmPassword.length > 0 && password === confirmPassword
  const initials = getInitials(fullName)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (ALLOWED_EMAIL && email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      setError('Registration is private. Only the site owner can create an account.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  const resetForm = () => {
    setSent(false)
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  return (
    <div
      className={`${display.variable} ${body.variable} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F2F3F8] px-5 py-12 font-[family-name:var(--font-body)]`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-[#3B4BFF]/10 blur-3xl"
      />

      <main className="relative w-full max-w-md">
        {/* Owner monogram */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B1F4B] font-[family-name:var(--font-display)] text-2xl font-semibold text-white shadow-lg shadow-[#1B1F4B]/25"
            aria-hidden="true"
          >
            {initials || <PenIcon />}
          </span>
          <p className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-slate-900">
            {SITE_NAME}
          </p>
          <p className="text-sm text-slate-500">{SITE_TAGLINE}</p>
        </div>

        {sent ? (
          /* ------------------------ Success state ------------------------ */
          <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <MailIcon />
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900">
              Check your inbox
            </h1>
            <p className="mt-3 text-slate-600">
              We sent a confirmation link to{' '}
              <span className="font-medium text-slate-900">{email}</span>. Open it to activate your
              account.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full rounded-xl bg-[#1B1F4B] py-3.5 font-semibold text-white transition hover:bg-[#262b66] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3B4BFF]/30"
              >
                Go to login
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3B4BFF]/20"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          /* --------------------------- Form ----------------------------- */
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900">
              Set up your account
            </h1>
            <p className="mt-2 text-slate-500">
              Create the login you&apos;ll use to write and publish.
            </p>

            <form onSubmit={handleSignUp} className="mt-7 space-y-4">
              <Field id="fullName" label="Full name" icon={<UserIcon />}>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>

              <Field id="email" label="Email" icon={<MailIcon />}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>

              <Field
                id="password"
                label="Password"
                icon={<LockIcon />}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="rounded-lg p-2 text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B4BFF]"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                }
                hint={
                  password.length > 0 && (
                    <div className="mt-2.5" aria-live="polite">
                      <div className="flex gap-1.5" aria-hidden="true">
                        {[1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              i <= strength.score ? strengthColors[strength.score] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {strength.label}
                        {strength.score < 4 && strength.score > 1
                          ? ' · Add length, mixed case, numbers or symbols'
                          : ''}
                      </p>
                    </div>
                  )
                }
              >
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  required
                />
              </Field>

              <Field
                id="confirmPassword"
                label="Confirm password"
                icon={<LockIcon />}
                right={
                  matches ? (
                    <span className="flex p-2 text-emerald-600">
                      <CheckIcon />
                    </span>
                  ) : null
                }
                hint={
                  mismatch && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600" role="alert">
                      <AlertIcon /> Passwords do not match
                    </p>
                  )
                }
              >
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={mismatch}
                  className={`${inputClass} pr-12 ${
                    mismatch ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''
                  }`}
                  required
                />
              </Field>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  <span className="mt-0.5 shrink-0">
                    <AlertIcon />
                  </span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#3B4BFF] py-3.5 font-semibold text-white shadow-lg shadow-[#3B4BFF]/25 transition hover:bg-[#2f3ee6] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3B4BFF]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                {loading && <Spinner />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already registered?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#3B4BFF] underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}