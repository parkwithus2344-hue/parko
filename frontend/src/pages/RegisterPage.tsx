import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Car, Building2, ScrollText, X } from 'lucide-react'
import { saveAuth, getToken } from '../lib/auth'
import { apiFetch } from '../lib/api'
import styles from './register.module.css'

type Role = 'user' | 'owner'

function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required'
  if (pw.length < 16) return 'Password must be at least 16 characters'
  if (!/[A-Z]/.test(pw)) return 'Must contain an uppercase letter'
  if (!/[a-z]/.test(pw)) return 'Must contain a lowercase letter'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Must contain a special character'
  return null
}

export default function RegisterPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getToken()) navigate('/search-parking', { replace: true })
  }, [navigate])

  const [role, setRole]       = useState<Role>('user')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [agreed, setAgreed]   = useState(false)

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', businessName: '' })
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { name: '', email: '', phone: '', password: '' }
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    const pwErr = validatePassword(form.password)
    if (pwErr) errs.password = pwErr
    if (errs.name || errs.email || errs.phone || errs.password) { setErrors(errs); return }
    setAgreed(false)
    setShowTerms(true)
  }

  const handleAgreeAndCreate = async () => {
    setShowTerms(false)
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, password: form.password,
          role, businessName: role === 'owner' ? form.businessName : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      saveAuth(data.token, data.user)
      navigate(data.user.role === 'owner' ? '/owner/dashboard' : '/search-parking')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pw = form.password

  return (
    <>
      <div className="page-wrapper">
        <div className={styles.wrap}>
          <div className={`card ${styles.card} animate-fadeUp`}>
            <h1 className={styles.heading}>Create your account</h1>
            <p className={styles.sub}>Join thousands of users on ParkSpot</p>

            <div className={styles.roleTabs}>
              <button className={`${styles.roleTab} ${role === 'user' ? styles.roleActive : ''}`} onClick={() => setRole('user')} type="button">
                <Car size={15} />Find Parking
              </button>
              <button className={`${styles.roleTab} ${role === 'owner' ? styles.roleActive : ''}`} onClick={() => setRole('owner')} type="button">
                <Building2 size={15} />List Parking
              </button>
            </div>

            {error && <p style={{ color: 'var(--danger, #ef4444)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>{error}</p>}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label className="label">Full name</label>
                <input className={`input ${errors.name ? styles.inputErr : ''}`} name="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" />
                {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              </div>

              <div className={styles.field}>
                <label className="label">Email address</label>
                <input className={`input ${errors.email ? styles.inputErr : ''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>

              <div className={styles.field}>
                <label className="label">Phone number</label>
                <input className={`input ${errors.phone ? styles.inputErr : ''}`} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
              </div>

              <div className={styles.field}>
                <label className="label">Password</label>
                <div className={styles.pwWrap}>
                  <input
                    className={`input ${errors.password ? styles.inputErr : ''}`}
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 16 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
                {pw && (
                  <div className={styles.pwReqs}>
                    <span className={pw.length >= 16 ? styles.reqMet : styles.reqUnmet}>✓ 16+ characters</span>
                    <span className={/[A-Z]/.test(pw) ? styles.reqMet : styles.reqUnmet}>✓ Uppercase</span>
                    <span className={/[a-z]/.test(pw) ? styles.reqMet : styles.reqUnmet}>✓ Lowercase</span>
                    <span className={/[^A-Za-z0-9]/.test(pw) ? styles.reqMet : styles.reqUnmet}>✓ Special char</span>
                  </div>
                )}
              </div>

              {role === 'owner' && (
                <div className={`${styles.field} animate-fadeIn`}>
                  <label className="label">Business name (optional)</label>
                  <input className="input" name="businessName" value={form.businessName} onChange={handleChange} placeholder="e.g. Kapoor Parking Services" />
                </div>
              )}

              <button type="submit" className={`btn-primary ${loading ? styles.loading : ''}`} disabled={loading}>
                {loading ? 'Creating account…' : `Create ${role === 'owner' ? 'owner' : ''} account →`}
              </button>
            </form>

            <p className={styles.switchText}>
              Already have one?{' '}
              <Link to="/login" className={styles.switchLink}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {showTerms && (
        <>
          <div className={styles.backdrop} onClick={() => setShowTerms(false)} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}><ScrollText size={22} /></div>
              <div>
                <h2 className={styles.modalTitle}>Terms &amp; Conditions</h2>
                <p className={styles.modalSub}>Please read before creating your account</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowTerms(false)}><X size={18} /></button>
            </div>

            <div className={styles.modalBody}>
              <h3>1. Acceptance of Terms</h3>
              <p>By creating an account on ParkSpot, you agree to be bound by these Terms and Conditions.</p>
              <h3>2. User Accounts</h3>
              <p>You are responsible for maintaining the confidentiality of your account credentials and all activity under your account.</p>
              <h3>3. Parking Listings</h3>
              <p>Owners must ensure their listings are accurate, available, and lawfully offered. ParkSpot may remove violating listings.</p>
              <h3>4. Bookings &amp; Payments</h3>
              <p>All bookings are subject to availability. A platform fee applies to each booking. Cancellation policies are set by spot owners.</p>
              <h3>5. User Conduct</h3>
              <p>You agree not to misuse the platform, post false information, or engage in fraudulent activity.</p>
              <h3>6. Privacy Policy</h3>
              <p>We collect personal information to provide our services. Your data is stored securely and never sold to third parties.</p>
              <h3>7. Limitation of Liability</h3>
              <p>ParkSpot is a marketplace. We are not liable for disputes between users or damage to vehicles.</p>
              <h3>8. Contact</h3>
              <p>For questions, contact us at support@parkspot.in</p>
            </div>

            <div className={styles.modalFooter}>
              <label className={styles.agreeLabel}>
                <input type="checkbox" className={styles.agreeCheck} checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                I have read and agree to the Terms &amp; Conditions and Privacy Policy
              </label>
              <div className={styles.modalBtns}>
                <button className="btn-outline" onClick={() => setShowTerms(false)}>Cancel</button>
                <button className="btn-primary" disabled={!agreed} onClick={handleAgreeAndCreate}>
                  Agree &amp; Create Account
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
