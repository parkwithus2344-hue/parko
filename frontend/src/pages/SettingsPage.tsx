import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, SlidersHorizontal, Trash2, Eye, EyeOff, CheckCircle, Sun, Moon, AlertTriangle } from 'lucide-react'
import { getToken, getUser, saveAuth, clearAuth, type AuthUser } from '../lib/auth'
import { apiFetch } from '../lib/api'
import styles from './settings.module.css'

type Tab = 'profile' | 'preferences' | 'danger'

function validatePassword(pw: string): string | null {
  if (!pw)                        return 'Password is required'
  if (pw.length < 16)             return 'Must be at least 16 characters'
  if (!/[A-Z]/.test(pw))         return 'Must contain an uppercase letter'
  if (!/[a-z]/.test(pw))         return 'Must contain a lowercase letter'
  if (!/[^A-Za-z0-9]/.test(pw))  return 'Must contain a special character'
  return null
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [user, setUser]   = useState<AuthUser | null>(null)
  const [tab,  setTab]    = useState<Tab>('profile')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const [profile, setProfile]           = useState({ name: '', phone: '' })
  const [profileErr, setProfileErr]     = useState({ name: '', phone: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileOk, setProfileOk]       = useState(false)
  const [profileApiErr, setProfileApiErr] = useState('')

  const [pw, setPw]           = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr]     = useState({ current: '', next: '', confirm: '' })
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwOk, setPwOk]       = useState(false)
  const [pwApiErr, setPwApiErr] = useState('')

  const [showDelete, setShowDelete] = useState(false)
  const [delPw, setDelPw]           = useState('')
  const [delPwErr, setDelPwErr]     = useState('')
  const [showDelPw, setShowDelPw]   = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [delApiErr, setDelApiErr]   = useState('')

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return }
    const u = getUser()
    if (!u) { navigate('/login'); return }
    setUser(u)
    setProfile({ name: u.name, phone: u.phone || '' })
    const saved = localStorage.getItem('parkspot_theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [navigate])

  const applyTheme = (t: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('parkspot_theme', t)
    setTheme(t)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { name: '', phone: '' }
    if (!profile.name.trim())  errs.name  = 'Name is required'
    if (!profile.phone.trim()) errs.phone = 'Phone is required'
    if (errs.name || errs.phone) { setProfileErr(errs); return }

    setProfileSaving(true); setProfileOk(false); setProfileApiErr('')
    try {
      const res  = await apiFetch('/api/user/update', {
        method: 'PATCH',
        body:   JSON.stringify({ name: profile.name, phone: profile.phone }),
      })
      const data = await res.json()
      if (!res.ok) { setProfileApiErr(data.error || 'Update failed'); return }
      saveAuth(getToken()!, data.user)
      setUser(data.user)
      setProfileOk(true)
      setTimeout(() => setProfileOk(false), 3000)
    } catch {
      setProfileApiErr('Something went wrong. Try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { current: '', next: '', confirm: '' }
    if (!pw.current) errs.current = 'Current password is required'
    const nextErr = validatePassword(pw.next)
    if (nextErr) errs.next = nextErr
    if (pw.next !== pw.confirm) errs.confirm = 'Passwords do not match'
    if (errs.current || errs.next || errs.confirm) { setPwErr(errs); return }

    setPwSaving(true); setPwOk(false); setPwApiErr('')
    try {
      const res  = await apiFetch('/api/user/update', {
        method: 'PATCH',
        body:   JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      })
      const data = await res.json()
      if (!res.ok) { setPwApiErr(data.error || 'Update failed'); return }
      setPw({ current: '', next: '', confirm: '' })
      setPwOk(true)
      setTimeout(() => setPwOk(false), 3000)
    } catch {
      setPwApiErr('Something went wrong. Try again.')
    } finally {
      setPwSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!delPw) { setDelPwErr('Password is required'); return }
    setDeleting(true); setDelApiErr('')
    try {
      const res  = await apiFetch('/api/user/delete', {
        method: 'DELETE',
        body:   JSON.stringify({ password: delPw }),
      })
      const data = await res.json()
      if (!res.ok) { setDelApiErr(data.error || 'Deletion failed'); return }
      clearAuth()
      navigate('/login')
    } catch {
      setDelApiErr('Something went wrong. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (!user) return null

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',     label: 'Profile',     icon: <User size={15} /> },
    { id: 'preferences', label: 'Preferences', icon: <SlidersHorizontal size={15} /> },
    { id: 'danger',      label: 'Danger Zone', icon: <Trash2 size={15} /> },
  ]

  return (
    <div className="page-wrapper">
      <div className="animate-fadeUp" style={{ marginBottom: 28 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className={styles.mobileTabs}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`${styles.mobileTab} ${tab === t.id ? (t.id === 'danger' ? styles.mobileTabDangerActive : styles.mobileTabActive) : ''}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className={`${styles.layout} animate-fadeUp delay-1`}>
        <aside className={styles.sidebar}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`${styles.sidebarTab} ${t.id === 'danger' ? styles.sidebarTabDanger : ''} ${tab === t.id ? (t.id === 'danger' ? styles.sidebarTabDangerActive : styles.sidebarTabActive) : ''}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </aside>

        <div className={`card ${styles.panel}`}>
          {tab === 'profile' && (
            <>
              <h2 className={styles.sectionTitle}>Profile</h2>
              <p className={styles.sectionSub}>Update your name and phone number</p>

              <form className={styles.form} onSubmit={handleProfileSave} noValidate>
                <div className={styles.field}>
                  <label className="label">Full name</label>
                  <input className={`input ${profileErr.name ? styles.inputErr : ''}`} value={profile.name} onChange={e => { setProfile(p => ({ ...p, name: e.target.value })); setProfileErr(v => ({ ...v, name: '' })) }} placeholder="Rahul Sharma" />
                  {profileErr.name && <span className={styles.fieldError}>{profileErr.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className="label">Email address</label>
                  <div className={styles.readonlyInput}>{user.email}</div>
                </div>

                <div className={styles.field}>
                  <label className="label">Phone number</label>
                  <input className={`input ${profileErr.phone ? styles.inputErr : ''}`} type="tel" value={profile.phone} onChange={e => { setProfile(p => ({ ...p, phone: e.target.value })); setProfileErr(v => ({ ...v, phone: '' })) }} placeholder="+91 98765 43210" />
                  {profileErr.phone && <span className={styles.fieldError}>{profileErr.phone}</span>}
                </div>

                {profileApiErr && <p className={styles.errorMsg}>{profileApiErr}</p>}

                <div className={styles.saveRow}>
                  <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={profileSaving}>
                    {profileSaving ? 'Saving…' : 'Save changes'}
                  </button>
                  {profileOk && <span className={styles.successMsg}><CheckCircle size={14} /> Saved!</span>}
                </div>
              </form>

              <div className={styles.divider} />

              <h3 className={styles.subHeading}>Change password</h3>
              <form className={styles.form} onSubmit={handlePwSave} noValidate>
                <div className={styles.field}>
                  <label className="label">Current password</label>
                  <div className={styles.pwWrap}>
                    <input className={`input ${pwErr.current ? styles.inputErr : ''}`} type={showCur ? 'text' : 'password'} value={pw.current} onChange={e => { setPw(p => ({ ...p, current: e.target.value })); setPwErr(v => ({ ...v, current: '' })) }} placeholder="Your current password" autoComplete="current-password" />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowCur(s => !s)} tabIndex={-1}>{showCur ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {pwErr.current && <span className={styles.fieldError}>{pwErr.current}</span>}
                </div>

                <div className={styles.field}>
                  <label className="label">New password</label>
                  <div className={styles.pwWrap}>
                    <input className={`input ${pwErr.next ? styles.inputErr : ''}`} type={showNew ? 'text' : 'password'} value={pw.next} onChange={e => { setPw(p => ({ ...p, next: e.target.value })); setPwErr(v => ({ ...v, next: '' })) }} placeholder="Min 16 characters" autoComplete="new-password" />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(s => !s)} tabIndex={-1}>{showNew ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {pwErr.next && <span className={styles.fieldError}>{pwErr.next}</span>}
                  {pw.next && (
                    <div className={styles.pwReqs}>
                      <span className={pw.next.length >= 16 ? styles.reqMet : styles.reqUnmet}>✓ 16+ characters</span>
                      <span className={/[A-Z]/.test(pw.next) ? styles.reqMet : styles.reqUnmet}>✓ Uppercase</span>
                      <span className={/[a-z]/.test(pw.next) ? styles.reqMet : styles.reqUnmet}>✓ Lowercase</span>
                      <span className={/[^A-Za-z0-9]/.test(pw.next) ? styles.reqMet : styles.reqUnmet}>✓ Special char</span>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className="label">Confirm new password</label>
                  <input className={`input ${pwErr.confirm ? styles.inputErr : ''}`} type="password" value={pw.confirm} onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwErr(v => ({ ...v, confirm: '' })) }} placeholder="Repeat new password" autoComplete="new-password" />
                  {pwErr.confirm && <span className={styles.fieldError}>{pwErr.confirm}</span>}
                </div>

                {pwApiErr && <p className={styles.errorMsg}>{pwApiErr}</p>}

                <div className={styles.saveRow}>
                  <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={pwSaving}>
                    {pwSaving ? 'Updating…' : 'Update password'}
                  </button>
                  {pwOk && <span className={styles.successMsg}><CheckCircle size={14} /> Password updated!</span>}
                </div>
              </form>
            </>
          )}

          {tab === 'preferences' && (
            <>
              <h2 className={styles.sectionTitle}>Preferences</h2>
              <p className={styles.sectionSub}>Customize your experience</p>

              <div className={styles.prefRow}>
                <div className={styles.prefLabel}>
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <div>
                    <div>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
                    <div className={styles.prefDesc}>Switch between dark and light theme</div>
                  </div>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={theme === 'light'} onChange={e => applyTheme(e.target.checked ? 'light' : 'dark')} />
                  <span className={`${styles.toggleTrack} ${theme === 'light' ? styles.on : ''}`}>
                    <span className={styles.toggleThumb} />
                  </span>
                </label>
              </div>
            </>
          )}

          {tab === 'danger' && (
            <>
              <h2 className={styles.sectionTitle}>Danger Zone</h2>
              <p className={styles.sectionSub}>Irreversible actions — proceed with caution</p>

              <div className={styles.dangerBox}>
                <p className={styles.dangerTitle}>Delete account</p>
                <p className={styles.dangerDesc}>Permanently deletes your account, all bookings, and (if owner) all listings. Cannot be undone.</p>
                <button className={styles.btnDanger} onClick={() => { setShowDelete(true); setDelPw(''); setDelPwErr(''); setDelApiErr('') }}>
                  Delete my account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showDelete && (
        <>
          <div className={styles.backdrop} onClick={() => setShowDelete(false)} />
          <div className={styles.modal}>
            <div className={styles.modalIcon}><AlertTriangle size={22} /></div>
            <h2 className={styles.modalTitle}>Delete your account?</h2>
            <p className={styles.modalDesc}>This will permanently erase your account, bookings, and listings. Enter your password to confirm.</p>

            <div className={styles.field}>
              <label className="label">Password</label>
              <div className={styles.pwWrap}>
                <input className={`input ${delPwErr ? styles.inputErr : ''}`} type={showDelPw ? 'text' : 'password'} value={delPw} onChange={e => { setDelPw(e.target.value); setDelPwErr('') }} placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowDelPw(s => !s)} tabIndex={-1}>{showDelPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {delPwErr  && <span className={styles.fieldError}>{delPwErr}</span>}
              {delApiErr && <span className={styles.fieldError}>{delApiErr}</span>}
            </div>

            <div className={styles.modalBtns}>
              <button className="btn-outline" onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</button>
              <button className={styles.btnDanger} onClick={handleDelete} disabled={deleting} style={{ width: '100%' }}>
                {deleting ? 'Deleting…' : 'Yes, delete account'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
