'use client'

import { useState } from 'react'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  EDIT THESE FOR YOUR CUSTOMER (keep in sync with the sign-up page)  */
/* ------------------------------------------------------------------ */
const SITE_NAME = 'My Blog'
const SITE_TAGLINE = 'Your personal space to write and publish.'
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
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  right?: React.ReactNode
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
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-[15px] text-slate-900 ' +
  'placeholder:text-slate-400 outline-none transition ' +
  'focus:border-[#3B4BFF] focus:ring-4 focus:ring-[#3B4BFF]/15'

/* ------------------------------- page ------------------------------- */

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
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
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B1F4B] text-white shadow-lg shadow-[#1B1F4B]/25"
            aria-hidden="true"
          >
            <PenIcon />
          </span>
          <p className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-slate-900">
            {SITE_NAME}
          </p>
          <p className="text-sm text-slate-500">{SITE_TAGLINE}</p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-slate-500">Log in to write and manage your blog.</p>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
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
            >
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-12`}
                required
              />
            </Field>

            {message && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                <span className="mt-0.5 shrink-0">
                  <AlertIcon />
                </span>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#3B4BFF] py-3.5 font-semibold text-white shadow-lg shadow-[#3B4BFF]/25 transition hover:bg-[#2f3ee6] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3B4BFF]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            >
              {loading && <Spinner />}
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              className="font-semibold text-[#3B4BFF] underline-offset-4 hover:underline"
            >
              Set up your account
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}