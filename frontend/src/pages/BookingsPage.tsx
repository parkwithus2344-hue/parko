import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { DBBooking } from '../lib/types'
import { getToken } from '../lib/auth'
import { apiFetch } from '../lib/api'
import styles from './bookings.module.css'

type StatusFilter = DBBooking['status'] | 'all'

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Pending',   value: 'pending'   },
]

export default function BookingsPage() {
  const navigate = useNavigate()
  const [bookings,   setBookings]   = useState<DBBooking[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<StatusFilter>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return }

    apiFetch('/api/bookings')
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      const res = await apiFetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        body:   JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
    } finally { setCancelling(null) }
  }

  const list = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="page-wrapper">
      <div className={`${styles.header} animate-fadeUp`}>
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={`${styles.filterRow} animate-fadeUp delay-1`}>
        {FILTERS.map(f => (
          <button key={f.value} className={`${styles.chip} ${filter === f.value ? styles.chipOn : ''}`} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>Loading bookings…</p>
      ) : list.length > 0 ? (
        <div className={styles.list}>
          {list.map((b, i) => (
            <div key={b._id} className={`card ${styles.row} animate-fadeUp`} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className={styles.rowIcon}>🅿️</div>

              <div className={styles.rowInfo}>
                <p className={styles.rowTitle}>{b.spotTitle}</p>
                <div className={styles.rowMeta}>
                  <span><MapPin size={11} />{b.spotAddress}</span>
                  <span>
                    <Clock size={11} />
                    {new Date(b.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    &nbsp;·&nbsp;
                    {new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    –{new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className={styles.rowRight}>
                <p className={styles.rowPrice}>₹{b.totalPrice}</p>
                <StatusBadge status={b.status} />
                {(b.status === 'confirmed' || b.status === 'pending') && (
                  <button
                    onClick={() => handleCancel(b._id)}
                    disabled={cancelling === b._id}
                    style={{ fontSize: 11, color: 'var(--danger,#ef4444)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                  >
                    {cancelling === b._id ? '…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Calendar size={48} strokeWidth={1.2} />
          <h3>No bookings here</h3>
          <p>Try a different filter or make your first booking</p>
        </div>
      )}
    </div>
  )
}
