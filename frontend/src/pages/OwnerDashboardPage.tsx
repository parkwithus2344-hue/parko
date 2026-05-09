import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Plus, Pencil, Building2 } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import EditSpotModal from '../components/EditSpotModal'
import { DBParkingSpot, DBBooking, OwnerStats } from '../lib/types'
import { getToken, getUser } from '../lib/auth'
import { apiFetch } from '../lib/api'
import styles from './dashboard.module.css'

export default function OwnerDashboardPage() {
  const navigate = useNavigate()

  const [tab,         setTab]         = useState<'spots' | 'bookings'>('spots')
  const [spots,       setSpots]       = useState<DBParkingSpot[]>([])
  const [bookings,    setBookings]    = useState<DBBooking[]>([])
  const [stats,       setStats]       = useState<OwnerStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [editingSpot, setEditingSpot] = useState<DBParkingSpot | null>(null)

  const user  = getUser()
  const token = getToken()

  useEffect(() => {
    if (!token || !user) { navigate('/login'); return }
    if (user.role !== 'owner') { setLoading(false); return }

    Promise.all([
      apiFetch(`/api/parking?ownerId=${user.id}`).then(r => r.json()),
      apiFetch('/api/bookings?forOwner=true').then(r => r.json()),
      apiFetch('/api/owner/stats').then(r => r.json()),
    ]).then(([spotsData, bookingsData, statsData]) => {
      setSpots(spotsData.spots          || [])
      setBookings(bookingsData.bookings || [])
      setStats(statsData.stats          || null)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [navigate, token, user?.role]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = (updated: DBParkingSpot) => {
    setSpots(prev => prev.map(s => s._id === updated._id ? updated : s))
    setEditingSpot(updated)
  }

  const handleDelete = (id: string) => {
    setSpots(prev => prev.filter(s => s._id !== id))
    setEditingSpot(null)
  }

  if (!token || !user) return null

  if (user.role !== 'owner') {
    return (
      <div className="page-wrapper" style={{ maxWidth: 560 }}>
        <h1 className="page-title animate-fadeUp">Owner Dashboard</h1>
        <p className="page-subtitle animate-fadeUp delay-1">You don&apos;t have any listings yet</p>

        <div className="card animate-fadeUp delay-2" style={{ padding: '36px 32px', marginTop: 24, textAlign: 'center' }}>
          <Building2 size={48} style={{ color: 'var(--accent)', marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 8 }}>List your first spot</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
            Add a parking spot to become an owner automatically. No extra sign-up needed.
          </p>
          <Link to="/add-parking" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '12px 32px' }}>
            + List a spot →
          </Link>
        </div>
      </div>
    )
  }

  const STAT_CARDS = stats ? [
    { label: 'Total earnings',  value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`, sub: `${stats.earningsGrowth}% this month`, accent: true },
    { label: 'Active spots',    value: `${stats.activeSpots}/${stats.totalSpots}`,         sub: 'listings live'                                      },
    { label: 'Total bookings',  value: `${stats.totalBookings}`,                           sub: `${stats.weeklyBookings} this week`                  },
    { label: 'Average rating',  value: `${stats.avgRating} ⭐`,                            sub: `${stats.totalReviews} reviews`                      },
  ] : []

  return (
    <div className="page-wrapper">
      <div className={`${styles.header} animate-fadeUp`}>
        <div>
          <h1 className="page-title">Owner Dashboard</h1>
          <p className="page-subtitle">Manage listings and track your earnings</p>
        </div>
        <Link to="/add-parking" className={styles.addBtn}><Plus size={15} />Add spot</Link>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>Loading dashboard…</p>
      ) : (
        <>
          <div className={`${styles.statsGrid} animate-fadeUp delay-1`}>
            {STAT_CARDS.map((s, i) => (
              <div key={i} className={`card ${styles.statCard}`}>
                <p className={styles.statLabel}>{s.label}</p>
                <p className={`${styles.statVal} ${s.accent ? styles.statAccent : ''}`}>{s.value}</p>
                <p className={styles.statSub}>{s.sub}</p>
              </div>
            ))}
          </div>

          <div className={`${styles.tabsRow} animate-fadeUp delay-2`}>
            <button className={`${styles.tabBtn} ${tab === 'spots' ? styles.tabOn : ''}`} onClick={() => setTab('spots')}>My Spots</button>
            <button className={`${styles.tabBtn} ${tab === 'bookings' ? styles.tabOn : ''}`} onClick={() => setTab('bookings')}>Incoming Bookings</button>
          </div>

          {tab === 'spots' && (
            <div className={styles.spotList}>
              {spots.length === 0 && (
                <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0' }}>No spots yet. <Link to="/add-parking" style={{ color: 'var(--accent)' }}>Add your first →</Link></p>
              )}
              {spots.map((spot, i) => (
                <div key={spot._id} className={`card ${styles.spotRow} animate-fadeUp`} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className={styles.spotIcon}>
                    {spot.photos?.[0]
                      ? <img src={spot.photos[0]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      : '🅿️'}
                  </div>
                  <div className={styles.spotInfo}>
                    <p className={styles.spotTitle}>{spot.title}</p>
                    <p className={styles.spotMeta}><MapPin size={11} />{spot.address}&nbsp;·&nbsp;₹{spot.pricePerHour}/hr</p>
                    <span className={`badge ${spot.isLive ? 'badge-available' : 'badge-booked'}`}>{spot.isLive ? 'Live' : 'Off'}</span>
                  </div>
                  <button className={styles.editBtn} onClick={() => setEditingSpot(spot)}>
                    <Pencil size={13} />Edit spot
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'bookings' && (
            <div className={styles.bookList}>
              {bookings.length === 0 && (
                <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0' }}>No bookings yet.</p>
              )}
              {bookings.map((b, i) => (
                <div key={b._id} className={`card ${styles.bookRow} animate-fadeUp`} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className={styles.spotIcon}>🅿️</div>
                  <div className={styles.spotInfo}>
                    <p className={styles.spotTitle}>{b.spotTitle}</p>
                    <p className={styles.spotMeta}>{b.spotAddress}</p>
                  </div>
                  <div className={styles.bookRight}>
                    <p className={styles.bookPrice}>₹{b.totalPrice}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editingSpot && (
        <EditSpotModal
          spot={editingSpot}
          isOpen={!!editingSpot}
          onClose={() => setEditingSpot(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
