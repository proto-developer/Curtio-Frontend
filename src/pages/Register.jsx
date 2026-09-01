import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Mail, Lock, User, ShieldCheck } from 'lucide-react'
import { useGoogleLogin } from "@react-oauth/google"
import { syncPendingUrl } from '../lib/sync'
import { FaBoltLightning, FaChartArea, FaLink } from 'react-icons/fa6'
import env from "../../Config/env";

const API = `${env.BACKEND_URL}/auth`;



export default function Register() {
  const navigate = useNavigate()

  // Step: 'form' | 'otp'
  const [step, setStep] = useState('form')

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message);
        } else {
          localStorage.setItem("apiToken", data.apiToken);
          localStorage.setItem("LoginUser", JSON.stringify(data.LoginUser));
          await syncPendingUrl(data.apiToken);
          navigate("/dashboard");
        }
      } catch {
        setError("Network error during Google login.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google Sign-Up failed.")
  });

  // OTP: 6 individual digit inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  /* ── Step 1: Register → send OTP ── */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message)
      } else {
        setSuccess(`OTP sent to ${form.email}`)
        setStep('otp')
      }
    } catch {
      setError('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  /* ── OTP digit change ── */
  function handleOtpChange(index, value) {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      if (value === '') {
        const next = [...otpDigits]
        next[index] = ''
        setOtpDigits(next)
      }
      return
    }

    // Handles a full code pasted or autofilled into a single box.
    if (digits.length > 1) {
      const next = [...otpDigits]
      let i = index
      for (const digit of digits) {
        if (i > 5) break
        next[i] = digit
        i++
      }
      setOtpDigits(next)
      otpRefs.current[Math.min(i, 5)]?.focus()
      return
    }

    const next = [...otpDigits]
    next[index] = digits
    setOtpDigits(next)
    if (index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  /* ── Step 2: Verify OTP ── */
  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    const otp = otpDigits.join('')
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message)
      } else {
        localStorage.setItem('apiToken', data.apiToken)
        localStorage.setItem('LoginUser', JSON.stringify(data.LoginUser))
        await syncPendingUrl(data.apiToken)
        navigate('/dashboard/analytics')
      }
    } catch {
      setError('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  /* ── Resend OTP ── */
  async function handleResend() {
    setError('')
    setSuccess('')
    setOtpDigits(['', '', '', '', '', ''])
    setLoading(true)
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) setSuccess('New OTP sent!')
      else setError(data.message)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Password strength ── */
  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-orange-400 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl" />
        </div>
        <Link
          to="/"
          className="font-bold text-2xl tracking-[-0.03em] text-white"
          style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
        >
          Curtio<span className="text-white">.</span>
        </Link>

        <div className="relative space-y-6">
          {[
            { emoji: <FaBoltLightning size={24} className="text-white" fill="white" /> , title: 'Shorten unlimited links', desc: 'No caps on how many links you create.' },
            { emoji: <FaChartArea size={24} className="text-white" fill="white" /> , title: 'Real-time analytics', desc: 'See every click, device, and country.' },
            { emoji: <FaLink size={24} className="text-white" fill="white" /> , title: 'Custom branded slugs', desc: 'Make your links memorable and on-brand.' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-lg shrink-0">
                {item.emoji}
              </div>
              <div>
                <div className="text-white font-semibold">{item.title}</div>
                <div className="text-indigo-200 text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900">Curtio</span>
          </Link>

          {/* ─── STEP 1: Registration Form ─── */}
          {step === 'form' && (
            <>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Create your account</h1>
              <p className="text-slate-500 mb-8">Free forever. No credit card needed.</p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Jane Smith"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600'][strength]}`}>
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="agree" className="text-sm text-slate-600 leading-snug">
                    I agree to the{' '}
                    <Link
                      to="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-indigo-600 font-medium cursor-pointer hover:underline"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      to="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-indigo-600 font-medium cursor-pointer hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreed}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : 'Create Account'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-3 text-xs text-slate-400 font-medium">OR CONTINUE WITH</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="w-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer text-slate-700 font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31.8 33.5C29.9 34.8 27.1 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 39.8 16.3 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.1 5.3l5.7 4.5C40.4 34.7 44 29.8 44 24c0-1.3-.2-2.7-.4-4z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </>
          )}

          {/* ─── STEP 2: OTP Verification ─── */}
          {step === 'otp' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={32} className="text-indigo-600" />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-1 text-center">Verify your email</h1>
              <p className="text-slate-500 mb-2 text-center text-sm">
                We sent a 6-digit code to
              </p>
              <p className="text-indigo-600 font-semibold text-center mb-8 text-sm">{form.email}</p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 text-center">
                  {success}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6-digit OTP input boxes */}
                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${i + 1} of 6`}
                      maxLength={i === 0 ? 6 : 1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : 'Verify & Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-slate-500">
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-indigo-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </p>
                <button
                  onClick={() => { setStep('form'); setError(''); setSuccess('') }}
                  className="text-sm text-slate-400 hover:text-slate-600 hover:underline"
                >
                  ← Back to registration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
