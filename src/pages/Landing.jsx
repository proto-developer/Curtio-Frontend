import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Zap, BarChart2, Shield, Globe, Copy, Check,
  Link as LinkIcon, QrCode, Clock, Lock, Target, Users,
  RefreshCw, FileDown, Filter, Shuffle, AlertTriangle,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Shortener, { SHORTENER_DOMAIN, generateSlug } from '../components/Shortner'
import ShortenerModal from '../components/shortenerModal'
import { BiLeftArrow } from 'react-icons/bi'
import { FaArrowRight } from 'react-icons/fa6'
import Footer from '../components/footer'
import ComparisonSection from '../components/Comparison.jsx'
import CTASection from '../components/cta.jsx'
import { setCookie, eraseCookie } from '../lib/cookies'
import { isLoggedIn } from '../lib/session'
import env from '../../Config/env'


const FEATURES = [
  { icon: <Zap size={20} />, tone: 'indigo', title: 'Lightning Fast Shortening', desc: 'Turn any URL into a clean short link in under a second. No friction, no account needed for quick shares.' },
  { icon: <BarChart2 size={20} />, tone: 'orange', title: 'Real-Time Analytics', desc: 'See every click: device, country, referrer, browser, OS — all updated live.' },
  { icon: <QrCode size={20} />, tone: 'indigo', title: 'QR Code Generation', desc: 'Every link gets a downloadable QR code — PNG or SVG, ready for print or digital.' },
  { icon: <Globe size={20} />, tone: 'orange', title: 'Custom Aliases', desc: 'Brand your links with human-readable slugs like redirect.curtio.io/your-campaign.' },
  { icon: <Clock size={20} />, tone: 'indigo', title: 'Link Expiration', desc: 'Set an expiry date on any link. After it expires, visitors see a clean "expired" message.' },
  { icon: <Lock size={20} />, tone: 'orange', title: 'Password Protection', desc: 'Add a password to any link. Only people with the password get redirected.' },
  { icon: <Target size={20} />, tone: 'indigo', title: 'Retargeting Pixels', desc: 'Embed your Facebook, Google, or LinkedIn pixel into any link — retarget every visitor automatically.' },
  { icon: <Shuffle size={20} />, tone: 'orange', title: 'Geo & Device Routing', desc: 'Send iOS users to the App Store, Android users to Play Store, and desktop users to your site — automatically.' },
]

const STATS = [
  { value: '2.4B+', label: 'Links shortened' },
  { value: '180+', label: 'Countries served' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<50ms', label: 'Redirect speed' },
]

const FREE_FEATURES = [
  'Shorten any URL instantly',
  'Up to 5 links/day (no account)',
  'Share links anywhere',
  'QR code for every link',
]

const REGISTERED_FEATURES = [
  'Everything in Guest, plus:',
  '1 fully tracked link',
  'Real-time click analytics',
  'Device, country & referrer data',
  'Custom alias for your link',
  'Link expiration control',
  'Password protection',
  'Dashboard to manage your link',
]

export default function Landing() {
  const [url, setUrl] = useState('')
  const [shortened, setShortened] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  function isValidUrl(str) {
    try { new URL(str); return true } catch { return false }
  }

  function formatTime(seconds) {
    if (seconds === null || seconds < 0) return '02:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  function handleTimerExpired() {
    setIsExpired(true)
    setTimeLeft(0)
    eraseCookie('brevly_pending_url')
    localStorage.removeItem('pending_url')
    localStorage.removeItem('pending_url_expires_at')
    localStorage.removeItem('pending_slug')
  }

  // Restore countdown timer on mount if pending URL exists
  useEffect(() => {
    const token = localStorage.getItem('apiToken')
    if (token) return

    const savedPending = localStorage.getItem('pending_url')
    const savedExpires = localStorage.getItem('pending_url_expires_at')
    const savedSlug = localStorage.getItem('pending_slug')

    if (savedPending && savedExpires) {
      const now = Date.now()
      const diff = Math.floor((Number(savedExpires) - now) / 1000)
      if (diff > 0) {
        setTimeLeft(diff)
        setIsExpired(false)
        setShortened(`${SHORTENER_DOMAIN}/${savedSlug || generateSlug()}`)
      } else {
        handleTimerExpired()
      }
    }
  }, [])

  // Live 1-second countdown interval
  useEffect(() => {
    if (timeLeft === null || isExpired) return

    if (timeLeft <= 0) {
      handleTimerExpired()
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          handleTimerExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, isExpired])

  async function handleShorten(e) {
    e.preventDefault()
    setError('')
    if (!url.trim()) { setError('Please enter a URL.'); return }
    if (!isValidUrl(url)) { setError('Please enter a valid URL (include https://).'); return }
    setLoading(true)

    const token = localStorage.getItem('apiToken')

    if (token) {
      try {
        const baseUrl = env.BACKEND_URL;
        const res = await fetch(`${baseUrl}/urls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            originalUrl: url
          })
        })
        const data = await res.json()
        if (data.success) {
          const shortenedUrl = `${SHORTENER_DOMAIN}/${data.url.shortCode}`
          setShortened(shortenedUrl)
        } else {
          if (data.message && data.message.includes('limit')) {
            setError("You have reached the free limit of 1 tracked link. Please delete your existing link from the Dashboard to create a new one, or log out to create a temporary guest link.")
          } else {
            setError(data.message || 'Could not shorten link.')
          }
        }
      } catch (err) {
        setError('Network error. Could not connect to server.')
      } finally {
        setLoading(false)
      }
    } else {
      setTimeout(() => {
        const slug = generateSlug()
        const shortenedUrl = `${SHORTENER_DOMAIN}/${slug}`
        const expiresAt = Date.now() + 120000; // 2 minutes (120 seconds)

        setShortened(shortenedUrl)
        setCookie('brevly_pending_url', url, 2 / (24 * 60)) // 2 minutes cookie
        localStorage.setItem('pending_url', url)
        localStorage.setItem('pending_url_expires_at', String(expiresAt))
        localStorage.setItem('pending_slug', slug)

        setTimeLeft(120)
        setIsExpired(false)
        setLoading(false)
      }, 700)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shortened)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#334155]">
      <Navbar />

      <main id="main">
      {/* ===================== HERO ===================== */}
      <section className="relative pt-36 pb-20 px-6 text-center overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[760px] h-[520px] rounded-full opacity-[0.16] blur-[120px] pointer-events-none"
          style={{ background: 'linear-gradient(120deg,#1E1B4B,#312E81 45%,#4F46E5)' }}
        />

        <div className="relative max-w-3xl mx-auto z-10">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            URL shortener with real click tracking
          </span>

          <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5 max-w-[20ch] mx-auto">
            One visitor.{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(120deg,#4F46E5 0%,#7C3AED 100%)' }}
            >
              One click.{' '}
            </span>
            Not Four.
          </h1>
          <p className="md:text-lg sm:text-xl text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed">
            curtio turns long URLs into clean short links and counts every click the right way. You see real visitors, not bots and link previews padding your numbers. That is the data you need before you spend another dollar or another hour on a channel.
          </p>


          {/* Shortener card */}
          <form onSubmit={handleShorten} className="max-w-2xl mx-auto text-left">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)]">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex items-center gap-3 flex-1 bg-[#FAFAFA] border border-slate-200 rounded-xl px-4 py-3.5 focus-within:border-indigo-600 focus-within:bg-white focus-within:shadow-[0_0_0_4px_#EEF2FF] transition-colors">
                  <LinkIcon size={18} className="text-slate-400 shrink-0" />
                  <label htmlFor="hero-url-input" className="sr-only">
                    Long URL to shorten
                  </label>
                  <input
                    id="hero-url-input"
                    type="text"
                    value={url}
                    onChange={e => { setUrl(e.target.value); setShortened(null); setError('') }}
                    placeholder="Paste your long URL here..."
                    className="flex-1 text-slate-800 placeholder-slate-400 bg-transparent outline-none text-sm "
                  />
                </div>
                <Shortener loading={loading} />
              </div>
              <p className="text-xs text-slate-500 mt-3 ml-1">
                {isLoggedIn() ? (
                  <>
                    Saved straight to your{' '}
                    <Link to="/dashboard" className="text-indigo-600 font-semibold hover:underline">Dashboard</Link>.
                  </>
                ) : (
                  <>
                    No account needed to try.{' '}
                    <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Sign up free</Link> to track it.
                  </>
                )}
              </p>
              {error && (
                <div className="mt-4 animate-[riseIn_.4s_ease] border-t border-dashed border-slate-200 pt-4">
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-red-500"
                    />
                    <span className="text-sm text-red-600">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {shortened && (
                <div className="mt-4 border-t border-dashed border-slate-200 pt-4 animate-[riseIn_.4s_ease]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[0.7rem] font-semibold tracking-wide text-slate-500 uppercase">
                      Your short link
                    </div>
                    {!isLoggedIn() && (
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-mono font-semibold text-xs px-2.5 py-1 rounded-full border border-indigo-100">
                        <Clock size={12} className="animate-pulse text-indigo-600" />
                        <span>{isExpired ? 'Expired' : `Expires in ${formatTime(timeLeft)}`}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex-1 min-w-[180px] bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 font-semibold text-indigo-700 text-base truncate">
                      {shortened}
                    </div>
                    <button
                      onClick={handleCopy}
                      type="button"
                      className="flex items-center gap-2 text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>

                  <div className="flex gap-3 items-start mt-3.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 text-sm text-amber-800 leading-relaxed">
                    <AlertTriangle size={19} className="text-amber-500 shrink-0 mt-0.5" />
                    {isLoggedIn() ? (
                      <span>
                        🎉 <strong className="text-amber-900">Saved to your account.</strong> Visit your{' '}
                        <Link to="/dashboard" className="text-indigo-600 font-semibold hover:underline">Dashboard</Link>{' '}
                        to track clicks, customize UTMs, set passwords, and view visitor logs.
                      </span>
                    ) : isExpired ? (
                      <span>
                        <strong className="text-red-900">⌛ Guest link expired!</strong>{' '}
                        <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create a free account</Link>{' '}
                        to make permanent links that never expire.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-amber-900">URL saved locally!</strong>{' '}
                        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link> or{' '}
                        <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create a free account</Link>{' '}
                        to push this link into your database and view it on your dashboard.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-md font-semibold text-slate-500 mt-3  text-center flex items-center gap-2 justify-center pt-2">
              <Link to="/accuracy" className="text-indigo-600 font-semibold">See how we count clicks</Link>
              <FaArrowRight size={12} className="text-indigo-600 inline" />
            </div>

          </form>
        </div>
      </section>

      {/* ===================== STATS STRIP ===================== */}
      <section className="bg-[#F1F5F9] border-y border-slate-200 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(stat => (
            <div key={stat.label} className="text-center relative">
              <div className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
              <div className="text-xs md:text-sm text-slate-600 mt-2 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== PROBLEM / SOLUTION ===================== */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            The numbers you've been trusting are wrong
          </h2>
          <p className="text-slate-500 text-base md:text-lg">
            Most shorteners log a click every time anything touches your link. A bot crawls it. A chat app fetches a preview. A spam filter scans it. All of that gets counted. So one real person can show up as four, and you never know which number was real.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-sm mb-4">1</span>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Counted four times</h3>
            <p className="text-slate-500 text-sm">A visitor opens your link. A preview bot grabs it. A scanner checks it. Other tools count all three as clicks.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-sm mb-4">2</span>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Real and noise look the same</h3>
            <p className="text-slate-500 text-sm">When the count is inflated, you can't see which channel actually worked. So effort goes into traffic that was never there.</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-600 rounded-2xl p-7 shadow-[0_8px_30px_-10px_rgba(79,70,229,0.35)]">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm mb-4">3</span>
            <h3 className="font-bold text-indigo-700 text-lg mb-2">Curtio counts once</h3>
            <p className="text-indigo-700/80 text-sm">We remove the duplicates. One real visitor counts as one click, a number on your dashboard you can actually act on.</p>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="py-10 md:py-20 px-6 bg-[#F1F5F9] border-y border-slate-200" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Everything you need, nothing you do not
            </h2>
            <p className="text-slate-500 text-sm md:text-lg max-w-xl mx-auto">
              curtio respects your time and your data. Here is what every link gives you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.tone === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-500'}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-10 md:py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Three steps and you're done
          </h2>
          <p className="text-slate-500 text-sm md:text-lg mb-12">From long URL to full insight.</p>
          <div className="grid sm:grid-cols-3 relative">
            {[
              { step: '1', title: 'Paste', desc: 'Drop any long URL into the Curtio shortener — no account needed for a basic short link.' },
              { step: '2', title: 'Shorten', desc: 'Instantly receive a clean redirect.curtio.io/… link. Sign up to claim a custom alias and track it.' },
              { step: '3', title: 'Track', desc: 'Watch real-time analytics roll in: who clicked, from where, on what device, from which channel.' },
            ].map((item, i) => (
              <div key={item.step} className="flex flex-col items-center text-center relative px-4">
                {i > 0 && (
                  <span className="hidden sm:block absolute top-[30px] left-[calc(-50%+30px)] w-[calc(100%-60px)] h-0.5"
                    style={{ background: 'repeating-linear-gradient(90deg,#CBD5E1 0 6px,transparent 6px 12px)' }} />
                )}
                <div className="relative z-10 w-[60px] h-[60px] rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-5 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)]">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComparisonSection />
      {/* ===================== TESTIMONIAL ===================== */}

      <section className="py-10 md:py-20 px-6">
        <div className="max-w-[1152px] mx-auto">
          {/* Section Heading */}
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-lg md:text-4xl font-extrabold tracking-[-0.02em] text-slate-900">
              Made for people who live by their numbers
            </h2>
          </div>

          {/* Testimonial */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-2xl md:text-[2rem] font-semibold leading-[1.3] tracking-[-0.02em] text-slate-900">
              <span className="text-indigo-600">&ldquo;</span>
              I share links in Facebook groups all day. curtio is the first tool
              where the click count actually matches what I see.
              <span className="text-indigo-600">&rdquo;</span>
            </p>

            {/* Author */}
            <div className="mt-8 inline-flex items-center gap-4 text-left">
              <div
                className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-500"
                style={{
                  background:
                    "linear-gradient(135deg,#EEF2FF,#FFF3EA)",
                }}
              >
                AM
              </div>

              <div>
                <p className="font-semibold text-slate-900">Alfrad Matt</p>
                <p className="text-sm text-slate-500">
                  Affiliate marketer · placeholder, replace before launch
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <CTASection heading={"Ready for numbers you can trust?"}
        description={"Make a free account in about 30 seconds. You get one fully tracked link with complete analytics, and you can move up to Plus whenever you outgrow it."}
        buttonText={"Get started free"}
        buttonLink="/register"
      />
      </main>

      <Footer />
    </div>
  )
}