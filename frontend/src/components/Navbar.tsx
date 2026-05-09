import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Menu, X, LogOut, Lock, Settings, Wallet, BarChart2, Sun, Moon, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getUser, clearAuth, type AuthUser } from '../lib/auth'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '/search-parking', label: 'Find Parking' },
  { href: '/bookings',       label: 'My Bookings'  },
  { href: '/owner/dashboard',label: 'Dashboard'    },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  const [menuOpen,    setMenuOpen]    = useState(false)
  const [user,        setUser]        = useState<AuthUser | null>(null)
  const [showPopup,   setShowPopup]   = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [theme,       setTheme]       = useState<'dark' | 'light'>('dark')

  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(getUser())
  }, [pathname])

  useEffect(() => {
    const saved = localStorage.getItem('parkspot_theme') as 'dark' | 'light' | null
    if (saved) applyTheme(saved)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccount(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const applyTheme = (t: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('parkspot_theme', t)
    setTheme(t)
  }

  const toggleTheme = () => applyTheme(theme === 'dark' ? 'light' : 'dark')

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    setMenuOpen(false)
    setShowAccount(false)
    navigate('/login')
  }

  const handleListSpot = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      setShowPopup(true)
    }
  }

  return (
    <>
      <nav className={styles.nav}>
        <Link to={user ? '/search-parking' : '/login'} className={styles.logo}>
          <MapPin size={18} strokeWidth={2.5} />
          Parko
        </Link>

        <div className={styles.links}>
          {NAV_LINKS.map(l => (
            user ? (
              <Link
                key={l.href}
                to={l.href}
                className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}
              >
                {l.label}
              </Link>
            ) : (
              <span key={l.href} className={`${styles.link} ${styles.linkDisabled}`}>
                {l.label}
              </span>
            )
          ))}
        </div>

        <div className={styles.right}>
          {user ? (
            <div className={styles.accountWrap} ref={accountRef}>
              <button
                className={`${styles.accountBtn} ${showAccount ? styles.accountBtnActive : ''}`}
                onClick={() => setShowAccount(o => !o)}
              >
                <span className={styles.accountAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className={styles.accountName}>{user.name.split(' ')[0]}</span>
                <ChevronDown size={13} className={`${styles.chevron} ${showAccount ? styles.chevronUp : ''}`} />
              </button>

              {showAccount && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownName}>{user.name}</span>
                    <span className={styles.dropdownEmail}>{user.email}</span>
                  </div>
                  <div className={styles.dropdownDivider} />

                  <Link to="/settings" className={styles.dropdownItem} onClick={() => setShowAccount(false)} style={{ textDecoration: 'none' }}>
                    <Settings size={14} />Settings
                  </Link>
                  <Link to="/wallet" className={styles.dropdownItem} onClick={() => setShowAccount(false)} style={{ textDecoration: 'none' }}>
                    <Wallet size={14} />Wallet
                  </Link>
                  <button className={styles.dropdownItem} disabled>
                    <BarChart2 size={14} />View Analytics
                    <span className={styles.soon}>Soon</span>
                  </button>

                  <div className={styles.dropdownDivider} />

                  <button className={styles.dropdownItem} onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    <span className={styles.themeToggle}>
                      <span className={`${styles.toggleTrack} ${theme === 'light' ? styles.toggleOn : ''}`}>
                        <span className={styles.toggleThumb} />
                      </span>
                    </span>
                  </button>

                  <div className={styles.dropdownDivider} />

                  <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                    <LogOut size={14} />Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.ghost}>Sign in</Link>
          )}

          <Link to="/add-parking" className={styles.pill} onClick={handleListSpot}>
            + List Spot
          </Link>

          <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className={styles.drawer}>
            {NAV_LINKS.map(l => (
              user ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className={`${styles.drawerLink} ${pathname === l.href ? styles.drawerActive : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ) : (
                <span key={l.href} className={`${styles.drawerLink} ${styles.drawerLinkDisabled}`}>
                  <Lock size={12} /> {l.label} — login first
                </span>
              )
            ))}
            <div className={styles.drawerDivider} />
            {user ? (
              <>
                <button className={styles.drawerLink} onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  className={styles.drawerLink}
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  Logout ({user.name.split(' ')[0]})
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>Sign in</Link>
            )}
            <span
              className={styles.drawerLink}
              style={{ cursor: user ? 'pointer' : 'default' }}
              onClick={() => { if (!user) { setMenuOpen(false); setShowPopup(true) } else { setMenuOpen(false); navigate('/add-parking') } }}
            >
              + List Spot
            </span>
          </div>
        )}
      </nav>

      {showPopup && (
        <>
          <div className={styles.popupBackdrop} onClick={() => setShowPopup(false)} />
          <div className={`${styles.popup} animate-fadeUp`}>
            <div className={styles.popupIcon}><Lock size={28} /></div>
            <h3 className={styles.popupTitle}>Login required</h3>
            <p className={styles.popupSub}>You need to sign in before you can list a parking spot.</p>
            <div className={styles.popupBtns}>
              <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }} onClick={() => setShowPopup(false)}>
                Sign in →
              </Link>
              <button className="btn-outline" onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
