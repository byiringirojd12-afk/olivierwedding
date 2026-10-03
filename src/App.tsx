import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getAdminAuthSnapshot, getSupabase, isSupabaseConfigured, setAdminAuthFromUser, subscribeToAdminAuth } from './lib/supabase'
import './App.css'

type Countdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type StoryChapter = {
  id: string
  title: string
  subtitle: string
  text: string
}

type FAQItem = {
  id: string
  question: string
  answer: string
}

type WeddingImage = {
  id: string
  title: string
  src: string
  alt: string
  size?: 'small' | 'medium' | 'large'
  category: 'couple' | 'gallery' | 'venue' | 'details'
}

type WeddingScheduleItem = {
  id: string
  time: string
  title: string
  location: string
  description: string
}

type Guest = {
  id: string
  name: string
  phone: string
  email: string
  seats: number
  invitationCode: string
  rsvpStatus: 'accepted' | 'declined' | 'pending'
  notes: string
}

type RSVP = {
  id: string
  guestName: string
  phone: string
  email: string
  guestCount: number
  attendance: 'accepted' | 'declined' | 'pending'
  message: string
  submittedAt: string
}

type WeddingSettings = {
  coupleNames: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueAddress: string
  venueDescription: string
  ceremonyVenueName: string
  ceremonyVenueAddress: string
  familyNames: string
  dressCode: string
  contactOlivier: string[]
  contactDeborah: string[]
  heroImage: string
  couplePhotos: WeddingImage[]
  galleryPhotos: WeddingImage[]
  venuePhotos: WeddingImage[]
  schedule: WeddingScheduleItem[]
  faq: FAQItem[]
  story: StoryChapter[]
  rsvpMessage: string
}

const defaultStory: StoryChapter[] = [
  {
    id: 'chapter-01',
    title: 'CHAPTER 01 — WHERE IT ALL BEGAN',
    subtitle: 'ETO Nyamata',
    text:
      'Some of the most beautiful stories in life begin without a plan. Ours began in a schoolyard at ETO Nyamata, where a simple smile created a connection neither of us could ignore. What started as a small moment of curiosity grew into deep conversations, laughter, and a friendship that felt effortless from the beginning.',
  },
  {
    id: 'chapter-02',
    title: 'CHAPTER 02 — FROM FRIENDSHIP TO LOVE',
    subtitle: 'Friendship',
    text:
      'We moved from friendship into something deeper with time, patience, and trust. The more we learned about each other, the more we realized that what we had was not only special but lasting. Our love grew quietly, but surely, in the everyday moments that became memories.',
  },
  {
    id: 'chapter-03',
    title: 'CHAPTER 03 — THE JOURNEY WE NEVER PLANNED',
    subtitle: 'Growing Together',
    text:
      'Looking back, it is beautiful to see how our story unfolded naturally. We grew as individuals and as a couple, learning to support one another, pray together, and build a future with faith and intention. The love we share is rooted in understanding, grace, and the joy of walking through life side by side.',
  },
  {
    id: 'chapter-04',
    title: 'CHAPTER 04 — A LIFELONG PROMISE',
    subtitle: 'Faith & Promise',
    text:
      'The journey has brought us to this meaningful moment. What began with a smile has become a life built on love, commitment, and faith. Today, we are grateful for the people who have walked with us and for the promise we are ready to make before God and our loved ones.',
  },
  {
    id: 'chapter-05',
    title: 'CHAPTER 05 — BEFORE GOD',
    subtitle: 'EPR GIKONDO — Karugira',
    text:
      'Our story now leads us to a sacred moment of promise. We will stand together before God, giving thanks for the journey behind us and embracing the future ahead of us with faith, joy, and commitment.',
  },
  {
    id: 'chapter-06',
    title: 'CHAPTER 06 — THE WEDDING',
    subtitle: '05 DECEMBER 2026',
    text:
      'After the memories, laughter, prayers, and dreams, the day we have been waiting for is finally here. Two families, two hearts, one promise, and one beautiful future.',
  },
]

const defaultSchedule: WeddingScheduleItem[] = [
  { id: 'ceremony', time: 'Wedding Vows', title: 'Vow Before God', location: 'EPR GIKONDO — Karugira', description: 'Join us as we make our vows before God.' },
  { id: 'celebration', time: '2:30 PM', title: 'Wedding Celebration', location: 'Berwa Garden', description: 'A joyful gathering with family and friends.' },
]

const defaultFaq: FAQItem[] = [
  { id: 'faq-1', question: 'Where will the ceremony take place?', answer: 'The wedding ceremony will take place at EPR GIKONDO — Karugira.' },
  { id: 'faq-2', question: 'Where will the reception be?', answer: 'The celebration and dinner will be held at Berwa Garden, Gikondo Merez 2.' },
  { id: 'faq-3', question: 'What time should guests arrive?', answer: 'Please refer to the time on your invitation and allow enough time to settle in before the ceremony.' },
  { id: 'faq-4', question: 'How do I confirm attendance?', answer: 'Please complete the RSVP form on this website to let us know if you will be joining us.' },
  { id: 'faq-5', question: 'Is parking available?', answer: 'Please contact Olivier or Deborah for the latest parking arrangements.' },
  { id: 'faq-6', question: 'Can I bring a guest?', answer: 'Each invitation includes the number of seats reserved for your party. Please check the invitation details or RSVP form before bringing additional guests.' },
  { id: 'faq-7', question: 'Are children invited?', answer: 'Please contact Olivier or Deborah to confirm arrangements for children in your party.' },
  { id: 'faq-8', question: 'How can I reach the couple?', answer: 'You can contact Olivier or Deborah using the phone numbers listed in the contact section.' },
]

const defaultGallery: WeddingImage[] = [
  { id: 'gallery-1', title: 'Our Story', src: '/images/wedding/gallery/WhatsApp Image 2026-10-02 at 11.31.00.jpeg', alt: 'Wedding story photo', category: 'gallery', size: 'large' },
  { id: 'gallery-2', title: 'School Memories', src: '/images/wedding/gallery/WhatsApp Image 2026-10-02 at 11.26.59.jpeg', alt: 'School memories photo', category: 'gallery', size: 'medium' },
  { id: 'gallery-3', title: 'Family', src: '/images/wedding/gallery/WhatsApp Image 2026-10-02 at 11.31.00m.jpeg', alt: 'Family moments photo', category: 'gallery', size: 'small' },
  { id: 'gallery-4', title: 'Wedding', src: '/images/wedding/gallery/WhatsApp Image 2026-10-02 at 11.31.00n.jpeg', alt: 'Wedding day photo', category: 'gallery', size: 'large' },
  { id: 'gallery-5', title: 'Friends', src: '/images/wedding/gallery/WhatsApp Image 2026-10-02 at 11.31.01.jpeg', alt: 'Friends photo', category: 'gallery', size: 'medium' },
  { id: 'gallery-6', title: 'Memories', src: '/images/wedding/gallery/WhatsApp Image 2026-10-02 at 22.44.33.jpeg', alt: 'Memories photo', category: 'gallery', size: 'small' },
]

const defaultWeddingSettings: WeddingSettings = {
  coupleNames: 'NKUNZIMANA Olivier & NIWE Deborah',
  weddingDate: '2026-12-05',
  weddingTime: '2:30 PM',
  venueName: 'Berwa Garden',
  venueAddress: 'Gikondo Merez 2, Kigali, Rwanda',
  venueDescription: 'A warm, elegant garden venue designed for a memorable celebration surrounded by love, family, and warm evening light.',
  ceremonyVenueName: 'EPR GIKONDO — Karugira',
  ceremonyVenueAddress: 'Kigali, Rwanda',
  familyNames: 'MUDAHERANWA Manasseh & BAZIRUWIHA Ezechias',
  dressCode: 'Please contact Olivier or Deborah for dress-code guidance.',
  contactOlivier: ['0785558141', '0782606716', '0783356716'],
  contactDeborah: ['0793821919', '0783052574', '788533872'],
  heroImage: '/images/wedding/couple/couple-hero.jpg',
  couplePhotos: [
    { id: 'couple-1', title: 'Olivier', src: '/images/wedding/couple/olivier.jpg', alt: 'Olivier portrait', category: 'couple', size: 'medium' },
    { id: 'couple-2', title: 'Deborah', src: '/images/wedding/couple/deborah.jpg', alt: 'Deborah portrait', category: 'couple', size: 'medium' },
  ],
  galleryPhotos: defaultGallery,
  venuePhotos: [
    { id: 'venue-1', title: 'Ceremony Venue', src: '/images/wedding/venue/ceremony.jpg', alt: 'Ceremony venue image', category: 'venue', size: 'medium' },
    { id: 'venue-2', title: 'Reception Venue', src: '/images/wedding/venue/reception.jpg', alt: 'Reception venue image', category: 'venue', size: 'medium' },
  ],
  schedule: defaultSchedule,
  faq: defaultFaq,
  story: defaultStory,
  rsvpMessage: 'Thank you for being part of our joyful day. We are so grateful to celebrate this moment with you.',
}

const weddingStorageKey = 'olivier-wedding-config'
const guestStorageKey = 'olivier-wedding-guests'

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function formatDisplayDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`)
  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

async function fetchSharedRsvps(): Promise<RSVP[]> {
  const client = await getSupabase()
  if (!client) throw new Error('Shared RSVP storage is not configured.')

  const { data, error } = await client
    .from('rsvps')
    .select('id, full_name, email, phone, attendance, guests, message, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    guestName: row.full_name,
    phone: row.phone,
    email: row.email ?? '',
    attendance: row.attendance as RSVP['attendance'],
    guestCount: row.guests,
    message: row.message ?? '',
    submittedAt: row.created_at,
  }))
}

function SharedRsvpTable({
  rsvps,
  loading,
  error,
  deletingId,
  onRefresh,
  onDelete,
}: {
  rsvps: RSVP[]
  loading: boolean
  error: string
  deletingId: string
  onRefresh: () => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="shared-rsvps">
      <div className="section-header">
        <h3>Shared RSVP Responses</h3>
        <button type="button" className="secondary-button admin-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh RSVPs'}
        </button>
      </div>
      {error && <div className="admin-state-error" role="alert">{error}</div>}
      {loading && <p className="admin-state" role="status">Loading shared RSVP responses…</p>}
      {!loading && !error && rsvps.length === 0 && <p className="admin-state">No shared RSVP responses yet.</p>}
      {rsvps.length > 0 && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Attendance</th>
                <th>Guests</th>
                <th>Message</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((rsvp) => (
                <tr key={rsvp.id}>
                  <td>{rsvp.guestName}</td>
                  <td>{rsvp.email ? <a href={`mailto:${rsvp.email}`}>{rsvp.email}</a> : '—'}</td>
                  <td>{rsvp.phone || '—'}</td>
                  <td>{rsvp.attendance === 'accepted' ? 'Attending' : rsvp.attendance === 'declined' ? 'Declined' : 'Pending'}</td>
                  <td>{rsvp.guestCount}</td>
                  <td>{rsvp.message || '—'}</td>
                  <td>{formatDateTime(rsvp.submittedAt)}</td>
                  <td><button type="button" className="danger-button" onClick={() => onDelete(rsvp.id)} disabled={deletingId === rsvp.id}>{deletingId === rsvp.id ? 'Removing…' : 'Remove'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function getCountdown(targetDate: Date): Countdown {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function SafeImage({ src, alt, className, fallbackText }: { src?: string; alt: string; className?: string; fallbackText: string }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return <div className={`${className ?? 'image-fallback'} image-fallback`}>{fallbackText}</div>
  }

  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" />
}

function useScrollReveals() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'))
      return
    }

    document.documentElement.classList.add('scroll-motion-ready')
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          currentObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

    targets.forEach((target) => observer.observe(target))
    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('scroll-motion-ready')
    }
  }, [])
}

function FloralDecoration({ className = '' }: { className?: string }) {
  return (
    <svg className={`floral-decoration ${className}`} viewBox="0 0 180 220" fill="none" aria-hidden="true">
      <path d="M22 204C53 164 53 122 75 86c16-26 35-40 65-56M52 151c-20-5-30-18-34-39 21 1 36 12 42 30M70 112c-3-20 4-35 20-47 8 19 5 37-10 52M89 79c-1-20 8-35 25-44 5 20 0 37-17 50M51 154c18-8 33-6 47 6-16 13-33 14-50 3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M139 30c0-9 12-12 16-4 4-8 16-5 16 4 0 7-8 13-16 19-8-6-16-12-16-19Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="155" cy="30" r="3" fill="currentColor" />
    </svg>
  )
}

function BotanicalDivider() {
  return (
    <div className="botanical-divider" aria-hidden="true">
      <span />
      <svg viewBox="0 0 32 28" fill="none">
        <path d="M16 24S3 16 3 8.5C3 2.5 11 1 16 7c5-6 13-4.5 13 1.5C29 16 16 24 16 24Z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicWeddingPage />} />
        <Route path="/invitation/:guestCode" element={<PersonalizedInvitationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function PublicWeddingPage() {
  useScrollReveals()
  const [weddingSettings] = useState<WeddingSettings>(() => readLocalStorage(weddingStorageKey, defaultWeddingSettings))
  const [countdown, setCountdown] = useState<Countdown>(() => {
    const initialSettings = readLocalStorage(weddingStorageKey, defaultWeddingSettings)
    return getCountdown(new Date(`${initialSettings.weddingDate}T14:30:00`))
  })
  const [invitationOpen, setInvitationOpen] = useState(() => sessionStorage.getItem('olivier-invitation-opened') === 'true')
  const [envelopeOpening, setEnvelopeOpening] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!envelopeOpening) return
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem('olivier-invitation-opened', 'true')
      setInvitationOpen(true)
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1600)
    return () => window.clearTimeout(timeout)
  }, [envelopeOpening])

  useEffect(() => {
    if (invitationOpen) return
    const previousOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousRootOverflow
    }
  }, [invitationOpen])

  const openInvitation = () => setEnvelopeOpening(true)

  useEffect(() => {
    const date = new Date(`${weddingSettings.weddingDate}T14:30:00`)
    const interval = window.setInterval(() => {
      setCountdown(getCountdown(date))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [weddingSettings.weddingDate])

  const weddingCompleted = countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const guestName = String(formData.get('guest-name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const guestCount = Number(formData.get('guest-count') || 1)
    const attendance = String(formData.get('attendance') || 'pending') as RSVP['attendance']
    const message = String(formData.get('message') || '').trim()

    if (!guestName || !phone) {
      setErrorMessage('Please enter your full name and phone number.')
      setSuccessMessage('')
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address or leave the email field blank.')
      setSuccessMessage('')
      return
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      setErrorMessage('Please enter a guest count between 1 and 20.')
      setSuccessMessage('')
      return
    }

    const duplicateKey = `${guestName.toLowerCase()}-${phone.replace(/\D/g, '')}`
    const duplicateToken = sessionStorage.getItem(`wedding-rsvp-v2-${duplicateKey}`)
    if (duplicateToken) {
      setErrorMessage('An RSVP for these details has already been submitted in this browser session. Contact the couple if you need to change it.')
      setSuccessMessage('')
      return
    }

    if (submittingRef.current) return
    if (!isSupabaseConfigured) {
      setErrorMessage('Online RSVPs are not configured yet. Please contact Olivier or Deborah directly to respond.')
      setSuccessMessage('')
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const client = await getSupabase()
      if (!client) throw new Error('Shared RSVP storage is not configured.')
      const { error } = await client.from('rsvps').insert({
        full_name: guestName,
        phone,
        email: email || null,
        attendance,
        guests: guestCount,
        message: message || null,
      })

      if (error) throw error

      try {
        sessionStorage.setItem(`wedding-rsvp-v2-${duplicateKey}`, 'submitted')
      } catch {
        // The database insert is authoritative; browser storage is only duplicate-submit UX.
      }
      setSuccessMessage(weddingSettings.rsvpMessage || 'Thank you for your response. We are delighted to celebrate with you.')
      form.reset()
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown database error.'
      if (import.meta.env.DEV) console.error('RSVP submission failed:', error)
      setErrorMessage(`We could not save your RSVP. Please try again or contact the couple. (${details})`)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="wedding-page">
      {!invitationOpen && (
        <div className={`invitation-overlay ${envelopeOpening ? 'is-opening' : ''}`} role="dialog" aria-modal="true" aria-label="Wedding invitation">
          <div className="envelope-experience">
            <FloralDecoration className="envelope-floral envelope-floral-left" />
            <FloralDecoration className="envelope-floral envelope-floral-right" />
            <p className="invitation-kicker">You’re Cordially Invited</p>
            <div className="envelope-scene">
              <div className="envelope-letter" aria-hidden="true">
                <span className="letter-rule" />
                <strong>{weddingSettings.coupleNames.split(' & ')[0]}</strong>
                <span className="letter-heart">♥</span>
                <strong>{weddingSettings.coupleNames.split(' & ')[1] || 'Together'}</strong>
                <small>{formatDisplayDate(weddingSettings.weddingDate)}</small>
              </div>
              <div className="envelope-back" />
              <div className="envelope-flap" />
              <div className="envelope-front" />
              <div className="wax-seal" aria-hidden="true">♥</div>
            </div>
            <p className="envelope-address">A celebration of love, faith &amp; forever</p>
            <button type="button" className="primary-button invitation-open-button" onClick={openInvitation} disabled={envelopeOpening}>
              Open Invitation
            </button>
          </div>
        </div>
      )}

      <header className="topbar" data-reveal="section">
        <a className="brand" href="#home" aria-label="Home">O <span>♥</span> D</a>
        <nav aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#story">Our Story</a>
          <a href="#details">Wedding Day</a>
          <a href="#venue">Venue</a>
          <a href="#gallery">Gallery</a>
          <a href="#rsvp">RSVP</a>
          <a href="#contact">Contact</a>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-copy" data-reveal="section">
            <p className="eyebrow">{weddingSettings.coupleNames}</p>
            <h2 id="hero-title">{formatDisplayDate(weddingSettings.weddingDate)}</h2>
            <blockquote>Two hearts. One promise. One beautiful beginning.</blockquote>
            <p className="hero-message">{weddingSettings.venueDescription}</p>
            <div className="countdown" aria-live="polite">
              {!weddingCompleted ? (
                <>
                  <div><strong>{countdown.days}</strong><span>DAYS</span></div>
                  <div><strong>{countdown.hours}</strong><span>HOURS</span></div>
                  <div><strong>{countdown.minutes}</strong><span>MINUTES</span></div>
                  <div><strong>{countdown.seconds}</strong><span>SECONDS</span></div>
                </>
              ) : (
                <div className="countdown-complete">Today we celebrate love. ❤️</div>
              )}
            </div>
          </div>
          <div className="hero-visual" data-reveal="section">
            <SafeImage src={weddingSettings.heroImage} alt={`${weddingSettings.coupleNames} main portrait`} className="image-placeholder" fallbackText="Couple Photo" />
            <FloralDecoration className="hero-botanical" />
          </div>
        </section>
        <BotanicalDivider />

        <section className="intro section-shell">
          <div className="section-heading narrow">
            <p className="eyebrow">A Day We Have Prayed For</p>
            <h3>Some days arrive quietly, and some days become part of our story forever.</h3>
          </div>
          <p>
            <strong>{formatDisplayDate(weddingSettings.weddingDate)}</strong> is the day we celebrate the beginning of our forever. It is a day of gratitude, faith, family, and the joy of stepping into a new chapter together.
          </p>
          <p>
            We are deeply grateful for the love and support that has brought us here, and we invite you to share in this beautiful beginning.
          </p>
        </section>

        <section className="story section-shell botanical-section" id="story">
          <FloralDecoration className="section-botanical story-botanical" />
          <div className="section-heading centered">
            <p className="eyebrow">OUR LOVE STORY</p>
            <h3>From a schoolyard smile to a lifelong promise.</h3>
          </div>
          <div className="story-grid">
            {weddingSettings.story.map((chapter, index) => (
              <article className="story-card" key={chapter.id} data-reveal="item">
                <div className="story-index">0{index + 1}</div>
                <div className="story-card-body">
                  <p className="story-label">{chapter.subtitle}</p>
                  <h4>{chapter.title}</h4>
                  <p>{chapter.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-story section-shell">
          <div className="feature-copy" data-reveal="section">
            <p className="eyebrow">OUR STORY</p>
            <h3>And now, our forever begins</h3>
            <p>
              What began with a simple smile has grown into a love filled with patience, laughter, trust, and faith. We are so grateful for every chapter that brought us here, and we now look forward to the day we begin this next chapter together.
            </p>
            <p className="signature">{weddingSettings.coupleNames}</p>
            <p className="signature-date">{formatDisplayDate(weddingSettings.weddingDate)}</p>
            <em>What began with a smile became a lifetime of love.</em>
          </div>
          <SafeImage src="/images/wedding/gallery/WhatsApp Image 2026-10-02 at 11.26.59.jpeg" alt="A memory from the couple’s story" className="story-photo" fallbackText="Story Photo" />
        </section>

        <section className="couple section-shell botanical-section" id="couple">
          <FloralDecoration className="section-botanical couple-botanical" />
          <div className="section-heading centered">
            <p className="eyebrow">THE COUPLE</p>
            <h3>Meet the Couple</h3>
          </div>
          <div className="couple-grid">
            {weddingSettings.couplePhotos.map((photo, index) => (
              <Fragment key={photo.id}>
                <article className="person-card" data-reveal="item">
                  <SafeImage src={photo.src} alt={photo.alt} className="person-photo" fallbackText={photo.title} />
                  <h4>{photo.title}</h4>
                  <p>
                    {photo.title === 'Olivier'
                      ? 'A thoughtful, sincere, and dedicated man whose love story began with a smile and grew into a deep commitment rooted in faith and devotion.'
                      : 'A warm, joyful, and graceful woman whose kindness and laughter made the beginning of this beautiful story unforgettable.'}
                  </p>
                </article>
                {index === 0 && <div className="heart-divider" aria-hidden="true">♥</div>}
              </Fragment>
            ))}
          </div>
        </section>

        <section className="details section-shell" id="details" data-reveal="section">
          <div className="section-heading centered">
            <p className="eyebrow">THE WEDDING DAY</p>
            <h3>Joyfully gathered in love and faith</h3>
          </div>
          <div className="detail-grid">
            <div className="detail-card">
              <p className="detail-label">Vow Before God</p>
              <h4>{weddingSettings.ceremonyVenueName}</h4>
              <p>{formatDisplayDate(weddingSettings.weddingDate)}</p>
              <p>{weddingSettings.ceremonyVenueAddress}</p>
            </div>
            <div className="detail-card emphasis">
              <p className="detail-label">Celebration &amp; Reception</p>
              <h4>{weddingSettings.venueName}</h4>
              <p>{weddingSettings.venueAddress}</p>
              <p>{weddingSettings.weddingTime}</p>
              <div className="detail-actions">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${weddingSettings.venueName} ${weddingSettings.venueAddress}`)}`} target="_blank" rel="noreferrer">VIEW LOCATION</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${weddingSettings.venueName} ${weddingSettings.venueAddress}`)}`} target="_blank" rel="noreferrer">GET DIRECTIONS</a>
              </div>
            </div>
          </div>
        </section>

        <section className="family section-shell">
          <div className="family-card">
            <p className="eyebrow">WITH THE BLESSING OF OUR FAMILIES</p>
            <h3>{weddingSettings.familyNames}</h3>
            <p>With the love, support, and blessing of our families, we joyfully invite you to share in this special day.</p>
          </div>
        </section>

        <section className="timeline section-shell">
          <div className="section-heading centered">
            <p className="eyebrow">{formatDisplayDate(weddingSettings.weddingDate)}</p>
            <h3>Wedding Day Timeline</h3>
          </div>
          <div className="timeline-list">
            {weddingSettings.schedule.map((item) => (
              <div className="timeline-item" key={item.id} data-reveal="item">
                <div className="timeline-dot" aria-hidden="true" />
                <div className="timeline-content">
                  <p className="timeline-time">{item.time}</p>
                  <h4>{item.title}</h4>
                  <p>{item.location}</p>
                  <small>{item.description}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="locations section-shell botanical-section" id="venue">
          <FloralDecoration className="section-botanical venue-botanical" />
          <div className="location-grid">
            {weddingSettings.venuePhotos.map((photo) => (
              <article className="location-card" key={photo.id} data-reveal="item">
                <p className="eyebrow">{photo.title === 'Ceremony Venue' ? 'WHERE WE MAKE OUR VOW' : 'WHERE WE CELEBRATE'}</p>
                <h3>{photo.title === 'Ceremony Venue' ? weddingSettings.ceremonyVenueName : weddingSettings.venueName}</h3>
                <p>{photo.title === 'Ceremony Venue' ? weddingSettings.ceremonyVenueAddress : weddingSettings.venueAddress}</p>
                <SafeImage src={photo.src} alt={photo.alt} className="venue-panel" fallbackText={photo.title} />
                <div className="detail-actions mini-actions">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${photo.title === 'Ceremony Venue' ? weddingSettings.ceremonyVenueName : weddingSettings.venueName} ${photo.title === 'Ceremony Venue' ? weddingSettings.ceremonyVenueAddress : weddingSettings.venueAddress}`)}`} target="_blank" rel="noreferrer">Open in Maps</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="gallery section-shell" id="gallery">
          <div className="section-heading centered">
            <p className="eyebrow">Moments Along the Way</p>
            <h3>Our Story in Photos</h3>
          </div>
          <div className="gallery-grid" aria-label="Wedding gallery">
            {weddingSettings.galleryPhotos.map((item) => (
              <div key={item.id} className={`gallery-item ${item.size ?? 'medium'}`} data-reveal="item">
                <SafeImage src={item.src} alt={item.alt} className="gallery-image" fallbackText={item.title} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rsvp section-shell botanical-section" id="rsvp" data-reveal="section">
          <FloralDecoration className="section-botanical rsvp-botanical" />
          <div className="section-heading centered">
            <p className="eyebrow">RSVP</p>
            <h3>Will You Celebrate With Us?</h3>
          </div>
          <p className="rsvp-copy">Your presence would mean the world to us. Please let us know whether you will be joining us for this unforgettable day.</p>
          {successMessage && <div className="form-success" role="status">{successMessage}</div>}
          {errorMessage && <div className="form-error" role="alert">{errorMessage}</div>}
          <form className="rsvp-form" onSubmit={handleSubmit}>
            <div className="field-row">
              <label>
                Full Name
                <input name="guest-name" type="text" autoComplete="name" placeholder="Your full name" required />
              </label>
              <label>
                Phone Number
                <input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" required />
              </label>
            </div>
            <div className="field-row">
              <label>
                Email
                <input name="email" type="email" autoComplete="email" placeholder="you@yourmail.com" />
              </label>
              <label>
                Number of Guests
                <input name="guest-count" type="number" min="1" defaultValue={1} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Attendance
                <select name="attendance" defaultValue="accepted">
                  <option value="accepted">Attending</option>
                  <option value="declined">Regretfully Decline</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
            </div>
            <label>
              Message
              <textarea name="message" rows={4} placeholder="Share a note with us" />
            </label>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'CONFIRM ATTENDANCE'}
            </button>
          </form>
        </section>

        <section className="contact section-shell" id="contact" data-reveal="section">
          <div className="section-heading centered">
            <p className="eyebrow">CONTACT</p>
            <h3>We Would Love to Hear From You</h3>
          </div>
          <div className="contact-grid">
            <div className="contact-card">
              <h4>Olivier</h4>
              {weddingSettings.contactOlivier.map((number) => (
                <a key={number} href={`tel:${number}`}>{number}</a>
              ))}
            </div>
            <div className="contact-card">
              <h4>Deborah</h4>
              {weddingSettings.contactDeborah.map((number) => (
                <a key={number} href={`tel:${number}`}>{number}</a>
              ))}
            </div>
          </div>
        </section>

        <section className="dress-code section-shell">
          <div className="section-heading centered">
            <p className="eyebrow">DRESS CODE</p>
            <h3>{weddingSettings.dressCode}</h3>
          </div>
        </section>

        <section className="faq section-shell">
          <div className="section-heading centered">
            <p className="eyebrow">FAQ</p>
            <h3>Everything you may want to know</h3>
          </div>
          <div className="faq-list">
            {weddingSettings.faq.map((item, index) => (
              <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={item.id}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span>{item.question}</span>
                  <span aria-hidden="true">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && <p>{item.answer}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="share section-shell">
          <div className="section-heading centered">
            <p className="eyebrow">SHARE OUR JOY</p>
            <h3>Celebrate with us</h3>
          </div>
          <div className="share-panel">
            <p>{weddingSettings.coupleNames}</p>
            <p>{formatDisplayDate(weddingSettings.weddingDate)}</p>
            <blockquote>A celebration of love, faith, family, and forever.</blockquote>
            <div className="detail-actions mini-actions">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${weddingSettings.coupleNames} | Wedding Invitation | ${formatDisplayDate(weddingSettings.weddingDate)}`)}`} target="_blank" rel="noreferrer">Share</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Facebook</a>
            </div>
          </div>
        </section>

        <section className="finale section-shell">
          <p className="eyebrow">AND SO, OUR FOREVER BEGINS...</p>
          <h3>We began as two separate stories.</h3>
          <p>
            Along the way, our paths crossed. We learned, we grew, we prayed, and we loved. And now, before God and the people we hold dear, we choose each other — not only for the beautiful days, but for every season that life brings.
          </p>
          <p className="finale-date">{formatDisplayDate(weddingSettings.weddingDate)}</p>
          <p className="finale-strong">It is the beginning of our forever.</p>
          <p className="signature">{weddingSettings.coupleNames}</p>
        </section>
      </main>

      <footer className="site-footer" data-reveal="section">
        <p>{weddingSettings.coupleNames}</p>
        <p>{formatDisplayDate(weddingSettings.weddingDate)}</p>
        <p>{weddingSettings.venueAddress}</p>
        <p>With love, faith &amp; gratitude</p>
      </footer>
    </div>
  )
}

function PersonalizedInvitationPage() {
  const { guestCode } = useParams()
  const [guests] = useState<Guest[]>(() => readLocalStorage(guestStorageKey, []))
  const guest = guests.find((entry) => entry.invitationCode === guestCode?.toUpperCase())

  if (!guest) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="invitation-page">
      <div className="invitation-personal-card">
        <p className="eyebrow">Personalized Invitation</p>
        <h1>Dear {guest.name},</h1>
        <p>We would be honoured to celebrate this special day with you.</p>
        <p className="invitation-personal-date">{formatDisplayDate(defaultWeddingSettings.weddingDate)}</p>
        <p className="invitation-personal-shift">{defaultWeddingSettings.venueName} • {defaultWeddingSettings.venueAddress} • {defaultWeddingSettings.weddingTime}</p>
        <Link to="/" className="primary-button">Open the full invitation</Link>
      </div>
    </div>
  )
}

function AdminPage() {
  const supabaseAuthenticated = useSyncExternalStore(subscribeToAdminAuth, getAdminAuthSnapshot, () => false)
  const isAuthenticated = supabaseAuthenticated
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guests' | 'rsvp' | 'gallery' | 'settings'>('dashboard')
  const [weddingConfig, setWeddingConfig] = useState<WeddingSettings>(() => readLocalStorage(weddingStorageKey, defaultWeddingSettings))
  const [guests, setGuests] = useState<Guest[]>(() => readLocalStorage(guestStorageKey, []))
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [rsvpsLoading, setRsvpsLoading] = useState(false)
  const [rsvpsError, setRsvpsError] = useState('')
  const [deletingRsvpId, setDeletingRsvpId] = useState('')
  const rsvpChannelRef = useRef<RealtimeChannel | null>(null)

  const refreshRsvps = useCallback(async () => {
    setRsvpsLoading(true)
    try {
      const sharedRsvps = await fetchSharedRsvps()
      setRsvps(sharedRsvps)
      setRsvpsError('')
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown database error.'
      if (import.meta.env.DEV) console.error('Could not fetch shared RSVPs:', error)
      setRsvpsError(`Could not load shared RSVPs. Check your connection and admin access. (${details})`)
    } finally {
      setRsvpsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured) return
    let active = true
    void getSupabase().then((client) => {
      if (!active || !client) return
      void refreshRsvps()
      rsvpChannelRef.current = client
        .channel('admin-rsvp-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, () => void refreshRsvps())
        .subscribe((status, error) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (import.meta.env.DEV) console.error('RSVP Realtime subscription failed:', error)
            setRsvpsError('Live RSVP updates are unavailable. Use Refresh RSVPs to check for new responses.')
          }
        })
    })
    return () => {
      active = false
      const channel = rsvpChannelRef.current
      rsvpChannelRef.current = null
      if (channel) void getSupabase().then((client) => client?.removeChannel(channel))
    }
  }, [isAuthenticated, refreshRsvps])

  const saveConfig = (nextSettings: WeddingSettings) => {
    setWeddingConfig(nextSettings)
    writeLocalStorage(weddingStorageKey, nextSettings)
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const client = await getSupabase()
      if (!client) throw new Error('Supabase is not configured. Admin sign-in is unavailable.')
      const { error } = await client.auth.signInWithPassword({ email: adminEmail.trim(), password: adminPassword })
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Supabase Auth error:', { name: error.name, status: error.status, code: error.code, message: error.message })
        }
        const invalidCredentials = error.status === 401
          || error.code === 'invalid_credentials'
          || error.message.toLowerCase() === 'invalid login credentials'
        setLoginError(invalidCredentials
          ? 'Invalid email or password.'
          : 'Could not complete Supabase sign-in. Please try again.')
        return
      }

      const { data: sessionData, error: sessionError } = await client.auth.getSession()
      if (sessionError || !sessionData.session) {
        throw new Error('Could not verify your authenticated session. Please try again.')
      }

      const { data: userData, error: userError } = await client.auth.getUser(sessionData.session.access_token)
      if (userError || !userData.user) {
        throw new Error('Could not verify your authenticated session. Please try again.')
      }

      const user = userData.user
      const role = user.app_metadata?.role
      if (import.meta.env.DEV) {
        console.info('Supabase authenticated user:', { id: user.id, email: user.email, appMetadataRole: role })
      }

      setAdminAuthFromUser(user)
      if (role !== 'wedding_admin') {
        setLoginError('Your account is authenticated but is not authorized as a wedding administrator.')
        return
      }

      setLoginError('')
      void refreshRsvps()
    } catch (error) {
      if (import.meta.env.DEV) console.error('Supabase session verification error:', error)
      setLoginError(error instanceof Error ? error.message : 'Could not verify your authenticated session. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const deleteSharedRsvp = async (id: string) => {
    if (!isSupabaseConfigured || !window.confirm('Remove this RSVP from the shared database?')) return
    setDeletingRsvpId(id)
    setRsvpsError('')
    try {
      const client = await getSupabase()
      if (!client) throw new Error('Shared RSVP storage is not configured.')
      const { error } = await client.from('rsvps').delete().eq('id', id)
      if (error) throw error
      setRsvps((current) => current.filter((rsvp) => rsvp.id !== id))
    } catch (error) {
      if (import.meta.env.DEV) console.error('Could not remove shared RSVP:', error)
      const details = error instanceof Error ? error.message : 'Unknown database error.'
      setRsvpsError(`Could not remove this RSVP. (${details})`)
    } finally {
      setDeletingRsvpId('')
    }
  }

  const stats = useMemo(() => {
    const totalRsvps = rsvps.length
    const accepted = rsvps.filter((entry) => entry.attendance === 'accepted').length
    const declined = rsvps.filter((entry) => entry.attendance === 'declined').length
    const pending = rsvps.filter((entry) => entry.attendance === 'pending').length
    const expectedGuests = rsvps.filter((entry) => entry.attendance === 'accepted').reduce((total, entry) => total + entry.guestCount, 0)
    return { totalRsvps, accepted, declined, pending, expectedGuests, guestCount: guests.length, galleryCount: weddingConfig.galleryPhotos.length }
  }, [rsvps, guests, weddingConfig.galleryPhotos])

  const updateConfig = <K extends keyof WeddingSettings>(field: K, value: WeddingSettings[K]) => {
    const nextConfig = { ...weddingConfig, [field]: value }
    saveConfig(nextConfig)
  }

  const addGuest = () => {
    const nextGuest: Guest = {
      id: crypto.randomUUID(),
      name: 'New Guest',
      phone: '',
      email: '',
      seats: 2,
      invitationCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      rsvpStatus: 'pending',
      notes: '',
    }
    const nextGuests = [nextGuest, ...guests]
    setGuests(nextGuests)
    writeLocalStorage(guestStorageKey, nextGuests)
  }

  const updateGuest = (id: string, field: keyof Guest, value: string | number) => {
    const nextGuests = guests.map((guest) => (guest.id === id ? { ...guest, [field]: value } : guest))
    setGuests(nextGuests)
    writeLocalStorage(guestStorageKey, nextGuests)
  }

  const deleteGuest = (id: string) => {
    const nextGuests = guests.filter((guest) => guest.id !== id)
    setGuests(nextGuests)
    writeLocalStorage(guestStorageKey, nextGuests)
  }

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const nextPhoto: WeddingImage = {
        id: crypto.randomUUID(),
        title: file.name,
        src: String(reader.result || ''),
        alt: file.name,
        category: 'gallery',
        size: 'medium',
      }

      const nextGallery = [nextPhoto, ...weddingConfig.galleryPhotos]
      updateConfig('galleryPhotos', nextGallery)
    }

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-shell">
        <div className="admin-login-card">
          <p className="eyebrow">Admin Access</p>
          <h2>Wedding Dashboard</h2>
          <form onSubmit={handleLogin} className="admin-login-form">
            <label>
              Admin Email
              <input type="email" autoComplete="username" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
            </label>
            {!isSupabaseConfigured && <p className="admin-config-note">Supabase is not configured. Admin access is disabled until the project settings are provided.</p>}
            {loginError && <div className="admin-state-error" role="alert">{loginError}</div>}
            <button type="submit" className="primary-button" disabled={isLoggingIn || !isSupabaseConfigured}>{isLoggingIn ? 'Signing in…' : 'Login'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">Wedding Admin</div>
        <nav>
          <button type="button" onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button type="button" onClick={() => { setActiveTab('guests'); void refreshRsvps() }}>Guests</button>
          <button type="button" onClick={() => { setActiveTab('rsvp'); void refreshRsvps() }}>RSVP</button>
          <button type="button" onClick={() => setActiveTab('gallery')}>Gallery</button>
          <button type="button" onClick={() => setActiveTab('settings')}>Settings</button>
        </nav>
        <button
          type="button"
          className="secondary-button admin-logout"
          onClick={() => {
            if (isSupabaseConfigured) void getSupabase().then((client) => client?.auth.signOut())
          }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-content">
        {activeTab === 'dashboard' && (
          <section>
            <div className="section-header">
              <h2>Dashboard</h2>
              <button type="button" className="secondary-button admin-refresh" onClick={() => void refreshRsvps()} disabled={rsvpsLoading}>{rsvpsLoading ? 'Refreshing…' : 'Refresh RSVP Data'}</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><span>Total RSVPs</span><strong>{stats.totalRsvps}</strong></div>
              <div className="stat-card"><span>Invited Guests</span><strong>{stats.guestCount}</strong></div>
              <div className="stat-card"><span>Accepted</span><strong>{stats.accepted}</strong></div>
              <div className="stat-card"><span>Declined</span><strong>{stats.declined}</strong></div>
              <div className="stat-card"><span>Pending</span><strong>{stats.pending}</strong></div>
              <div className="stat-card"><span>Expected Attendance</span><strong>{stats.expectedGuests}</strong></div>
              <div className="stat-card"><span>Gallery Images</span><strong>{stats.galleryCount}</strong></div>
            </div>
          </section>
        )}

        {activeTab === 'guests' && (
          <section>
            <div className="section-header">
              <h2>Guests</h2>
              <button type="button" className="primary-button" onClick={addGuest}>Add Guest</button>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Seats</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id}>
                      <td><input value={guest.name} onChange={(event) => updateGuest(guest.id, 'name', event.target.value)} /></td>
                      <td><input value={guest.phone} onChange={(event) => updateGuest(guest.id, 'phone', event.target.value)} /></td>
                      <td><input value={guest.email} onChange={(event) => updateGuest(guest.id, 'email', event.target.value)} /></td>
                      <td><input type="number" min="1" value={guest.seats} onChange={(event) => updateGuest(guest.id, 'seats', Number(event.target.value))} /></td>
                      <td><input value={guest.invitationCode} onChange={(event) => updateGuest(guest.id, 'invitationCode', event.target.value)} /></td>
                      <td>
                        <select value={guest.rsvpStatus} onChange={(event) => updateGuest(guest.id, 'rsvpStatus', event.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                      <td><button type="button" className="danger-button" onClick={() => deleteGuest(guest.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SharedRsvpTable rsvps={rsvps} loading={rsvpsLoading} error={rsvpsError} deletingId={deletingRsvpId} onRefresh={() => void refreshRsvps()} onDelete={(id) => void deleteSharedRsvp(id)} />
          </section>
        )}

        {activeTab === 'rsvp' && (
          <section>
            <h2>RSVP Management</h2>
            <SharedRsvpTable rsvps={rsvps} loading={rsvpsLoading} error={rsvpsError} deletingId={deletingRsvpId} onRefresh={() => void refreshRsvps()} onDelete={(id) => void deleteSharedRsvp(id)} />
          </section>
        )}

        {activeTab === 'gallery' && (
          <section>
            <div className="section-header">
              <h2>Gallery</h2>
              <label className="upload-button">
                Upload Image
                <input type="file" accept="image/*" onChange={handleGalleryUpload} />
              </label>
            </div>
            <div className="gallery-admin-grid">
              {weddingConfig.galleryPhotos.map((item) => (
                <div key={item.id} className="gallery-admin-card">
                  <img src={item.src} alt={item.alt} />
                  <div className="gallery-card-meta">
                    <strong>{item.title}</strong>
                    <span>{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section>
            <h2>Wedding Settings</h2>
            <div className="admin-form-grid">
              <label>
                Couple Names
                <input value={weddingConfig.coupleNames} onChange={(event) => updateConfig('coupleNames', event.target.value)} />
              </label>
              <label>
                Wedding Date
                <input type="date" value={weddingConfig.weddingDate} onChange={(event) => updateConfig('weddingDate', event.target.value)} />
              </label>
              <label>
                Wedding Time
                <input value={weddingConfig.weddingTime} onChange={(event) => updateConfig('weddingTime', event.target.value)} />
              </label>
              <label>
                Venue Name
                <input value={weddingConfig.venueName} onChange={(event) => updateConfig('venueName', event.target.value)} />
              </label>
              <label>
                Venue Address
                <input value={weddingConfig.venueAddress} onChange={(event) => updateConfig('venueAddress', event.target.value)} />
              </label>
              <label>
                Ceremony Venue
                <input value={weddingConfig.ceremonyVenueName} onChange={(event) => updateConfig('ceremonyVenueName', event.target.value)} />
              </label>
              <label>
                Venue Description
                <textarea value={weddingConfig.venueDescription} onChange={(event) => updateConfig('venueDescription', event.target.value)} />
              </label>
              <label>
                Dress Code
                <textarea value={weddingConfig.dressCode} onChange={(event) => updateConfig('dressCode', event.target.value)} />
              </label>
              <label>
                Family Names
                <input value={weddingConfig.familyNames} onChange={(event) => updateConfig('familyNames', event.target.value)} />
              </label>
              <label>
                RSVP Message
                <textarea value={weddingConfig.rsvpMessage} onChange={(event) => updateConfig('rsvpMessage', event.target.value)} />
              </label>
              <label>
                Hero Image
                <input value={weddingConfig.heroImage} onChange={(event) => updateConfig('heroImage', event.target.value)} />
              </label>
            </div>
            <div className="admin-form-grid">
              <label>
                Olivier Contact
                <textarea value={weddingConfig.contactOlivier.join(', ')} onChange={(event) => updateConfig('contactOlivier', event.target.value.split(',').map((item) => item.trim()))} />
              </label>
              <label>
                Deborah Contact
                <textarea value={weddingConfig.contactDeborah.join(', ')} onChange={(event) => updateConfig('contactDeborah', event.target.value.split(',').map((item) => item.trim()))} />
              </label>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
