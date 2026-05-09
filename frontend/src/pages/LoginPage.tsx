import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, MapPin } from 'lucide-react'
import { saveAuth, getToken } from '../lib/auth'
import { apiFetch } from '../lib/api'
import styles from './login.module.css'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getToken()) navigate('/search-parking', { replace: true })
  }, [navigate])

  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { email: '', password: '' }
    if (!form.email.trim()) errs.email    = 'Email is required'
    if (!form.password)     errs.password = 'Password is required'
    if (errs.email || errs.password) { setErrors(errs); return }

    setLoading(true)
    setError('')

    try {
      const res  = await apiFetch('/api/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Login failed'); return }

      saveAuth(data.token, data.user)
      navigate(data.user.role === 'owner' ? '/owner/dashboard' : '/search-parking')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className={styles.wrap}>
        <div className={`card ${styles.card} animate-fadeUp`}>

          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <MapPin size={22} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>ParkSpot</span>
          </div>

          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.sub}>Sign in to continue to your account</p>

          {error && (
            <p style={{ color: 'var(--danger, #ef4444)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className="label">Email address</label>
              <input
                className={`input ${errors.email ? styles.inputErr : ''}`}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className="label">Password</label>
                <button type="button" className={styles.forgotLink}>Forgot password?</button>
              </div>
              <div className={styles.pwWrap}>
                <input
                  className={`input ${errors.password ? styles.inputErr : ''}`}
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>

            <button
              type="submit"
              className={`btn-primary ${styles.submit} ${loading ? styles.loading : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div className={styles.dividerRow}><span />or<span /></div>

          <p className={styles.switchText}>
            No account?{' '}
            <Link to="/register" className={styles.switchLink}>Create one for free</Link>
          </p>
        </div>

        <p className={styles.trustNote}>🔒 Secure login · No spam, ever</p>
      </div>
    </div>
  )
}
