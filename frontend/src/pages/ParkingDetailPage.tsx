import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Shield, Zap, Clock, CheckCircle, Car, X, ChevronDown, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { DBParkingSpot } from '../lib/types'
import { getToken, getUser } from '../lib/auth'
import { apiFetch } from '../lib/api'
import DateTimePicker from '../components/DateTimePicker'
import styles from './detail.module.css'

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'CCTV':                  <Shield size={14} />,
  'EV Charging':           <Zap size={14} />,
  '24/7 Access':           <Clock size={14} />,
  'Security guard':        <Shield size={14} />,
  'Washroom':              <CheckCircle size={14} />,
  'Valet':                 <CheckCircle size={14} />,
  'Gated':                 <Shield size={14} />,
  'Wheelchair accessible': <CheckCircle size={14} />,
}

const VEHICLE_TYPES = ['Car', 'SUV', 'Bike / Scooter', 'Auto Rickshaw', 'Van', 'Other']

interface BookingForm {
  carNumber:           string
  vehicleType:         string
  specialInstructions: string
}

interface BookingErrors {
  carNumber:   string
  vehicleType: string
}

export default function ParkingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [spot,      setSpot]      = useState<DBParkingSpot | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const [booking,   setBooking]   = useState(false)
  const [bookErr,   setBookErr]   = useState('')
  const [lbOpen,    setLbOpen]    = useState(false)
  const [lbIndex,   setLbIndex]   = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [bForm,     setBForm]     = useState<BookingForm>({ carNumber: '', vehicleType: '', specialInstructions: '' })
  const [bErrors,   setBErrors]   = useState<BookingErrors>({ carNumber: '', vehicleType: '' })

  useEffect(() => {
    if (!lbOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     setLbOpen(false)
      if (e.key === 'ArrowRight') setLbIndex(i => (i + 1) % (spot?.photos?.length || 1))
      if (e.key === 'ArrowLeft')  setLbIndex(i => (i - 1 + (spot?.photos?.length || 1)) % (spot?.photos?.length || 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lbOpen, spot?.photos?.length])

  useEffect(() => {
    apiFetch(`/api/parking/${id}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(d => { if (d) setSpot(d.spot) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const hours = (() => {
    if (!startTime || !endTime) return 0
    const diff = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000
    return Math.max(0, Math.round(diff * 10) / 10)
  })()

  const subtotal    = spot ? hours * spot.pricePerHour : 0
  const platformFee = subtotal > 0 ? 10 : 0
  const total       = subtotal + platformFee

  const handleBookNowClick = () => {
    if (!getToken() || !getUser()) { navigate('/login'); return }
    setBookErr('')
    setBErrors({ carNumber: '', vehicleType: '' })
    setShowModal(true)
  }

  const handleConfirmBooking = async () => {
    const errs: BookingErrors = { carNumber: '', vehicleType: '' }
    const carNum = bForm.carNumber.trim()
    if (!carNum)
      errs.carNumber = 'Car number is required'
    else if (!/^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/i.test(carNum.replace(/\s/g, '')))
      errs.carNumber = 'Enter a valid number (e.g. DL 01 AB 1234)'
    if (!bForm.vehicleType)
      errs.vehicleType = 'Select a vehicle type'

    if (errs.carNumber || errs.vehicleType) { setBErrors(errs); return }

    setBooking(true); setBookErr('')
    try {
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          parkingId:           id,
          startTime, endTime,
          carNumber:           bForm.carNumber.trim().toUpperCase(),
          vehicleType:         bForm.vehicleType,
          specialInstructions: bForm.specialInstructions.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setBookErr(data.error || 'Booking failed'); return }
      setShowModal(false)
      navigate('/bookings')
    } catch {
      setBookErr('Something went wrong. Try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text3)' }}>Loading…</div>
  if (notFound || !spot) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h2>Spot not found</h2>
      <Link to="/search-parking" style={{ color: 'var(--accent)' }}>← Back to search</Link>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Link to="/search-parking" className={styles.back}>
        <ArrowLeft size={16} />Back to search
      </Link>

      <div className={styles.grid}>
        <div className="animate-fadeUp">
          <div
            className={`${styles.heroImg} ${spot.photos?.length ? styles.heroClickable : ''}`}
            onClick={() => { if (spot.photos?.length) { setLbIndex(0); setLbOpen(true) } }}
          >
            {spot.photos?.[0] ? (
              <img src={spot.photos[0]} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r2)' }} />
            ) : (
              <span className={styles.heroEmoji}>🅿️</span>
            )}
            <span className={`badge ${spot.isLive ? 'badge-available' : 'badge-booked'} ${styles.heroBadge}`}>
              {spot.isLive ? 'Available now' : 'Currently offline'}
            </span>
            {spot.photos?.length > 0 && (
              <div className={styles.heroOverlay}>
                <ZoomIn size={22} />
                <span>{spot.photos.length} photo{spot.photos.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {spot.photos?.length > 1 && (
            <div className={styles.thumbStrip}>
              {spot.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className={styles.thumb}
                  onClick={() => { setLbIndex(i); setLbOpen(true) }}
                />
              ))}
            </div>
          )}

          <h1 className={styles.title}>{spot.title}</h1>
          <p className={styles.loc}><MapPin size={13} />{spot.address}</p>

          <div className={styles.tags}>
            <span className={styles.tag}>{spot.spotType}</span>
            {spot.days?.slice(0, 3).map(d => <span key={d} className={styles.tag}>{d}</span>)}
          </div>

          <div className="divider" />

          <h2 className={styles.sectionHead}>About this spot</h2>
          <p className={styles.desc}>{spot.description || 'No description provided.'}</p>

          {spot.amenities?.length > 0 && (
            <>
              <div className="divider" />
              <h2 className={styles.sectionHead}>Amenities</h2>
              <div className={styles.amenities}>
                {spot.amenities.map(a => (
                  <div key={a} className={styles.amenity}>
                    <span className={styles.amenityIcon}>{AMENITY_ICONS[a] ?? <CheckCircle size={14} />}</span>
                    {a}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="divider" />
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            Available {spot.availableFrom} – {spot.availableTo}
            {spot.days?.length > 0 ? ` · ${spot.days.join(', ')}` : ''}
          </p>
        </div>

        <div className={styles.stickyWrap}>
          <div className={`card ${styles.bookCard} animate-fadeUp delay-2`}>
            <div className={styles.priceBig}>₹{spot.pricePerHour}<span>/hour</span></div>

            <div className={styles.liveRow}>
              <span className="glow-dot" />
              <span className={styles.liveText}>Updates in real-time</span>
            </div>

            <div className={styles.bookForm}>
              <div className={styles.timeRow}>
                <DateTimePicker
                  label="Start time"
                  value={startTime}
                  onChange={setStartTime}
                  min={new Date().toISOString()}
                />
                <DateTimePicker
                  label="End time"
                  value={endTime}
                  onChange={setEndTime}
                  min={startTime || new Date().toISOString()}
                />
              </div>

              {hours > 0 && (
                <div className={`${styles.breakdown} animate-fadeIn`}>
                  <div className={styles.breakRow}>
                    <span>{hours} hr{hours !== 1 ? 's' : ''} × ₹{spot.pricePerHour}</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className={styles.breakRow}><span>Platform fee</span><span>₹{platformFee}</span></div>
                  <div className="divider" style={{ margin: '10px 0' }} />
                  <div className={`${styles.breakRow} ${styles.breakTotal}`}>
                    <span>Total</span><span className={styles.totalAmt}>₹{total}</span>
                  </div>
                </div>
              )}

              {bookErr && (
                <p style={{ color: 'var(--danger,#ef4444)', fontSize: 13, textAlign: 'center' }}>
                  {bookErr}
                  {bookErr.includes('wallet') && (
                    <> — <a href="/wallet" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Add money →</a></>
                  )}
                </p>
              )}

              <button
                className="btn-primary"
                onClick={handleBookNowClick}
                disabled={!startTime || !endTime || hours <= 0 || !spot.isLive}
              >
                {total > 0 ? `Book & Pay ₹${total}` : 'Select times to book'}
              </button>

              <p className={styles.bookNote}>Instant confirmation · Free cancellation 1 hr before</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {lbOpen && spot.photos?.length > 0 && (
        <>
          <div className={styles.lbBackdrop} onClick={() => setLbOpen(false)} />
          <div className={styles.lbContainer}>
            <button className={styles.lbClose} onClick={() => setLbOpen(false)}><X size={20} /></button>
            <div className={styles.lbCounter}>{lbIndex + 1} / {spot.photos.length}</div>

            {spot.photos.length > 1 && (
              <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={e => { e.stopPropagation(); setLbIndex(i => (i - 1 + spot.photos.length) % spot.photos.length) }}>
                <ChevronLeft size={28} />
              </button>
            )}

            <img key={lbIndex} src={spot.photos[lbIndex]} alt={`Photo ${lbIndex + 1}`} className={styles.lbImg} />

            {spot.photos.length > 1 && (
              <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={e => { e.stopPropagation(); setLbIndex(i => (i + 1) % spot.photos.length) }}>
                <ChevronRight size={28} />
              </button>
            )}

            {spot.photos.length > 1 && (
              <div className={styles.lbDots}>
                {spot.photos.map((_, i) => (
                  <button key={i} className={`${styles.lbDot} ${i === lbIndex ? styles.lbDotActive : ''}`} onClick={e => { e.stopPropagation(); setLbIndex(i) }} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Booking Modal */}
      {showModal && (
        <>
          <div className={styles.modalBackdrop} onClick={() => { if (!booking) setShowModal(false) }} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrap}><Car size={20} /></div>
              <div>
                <h2 className={styles.modalTitle}>Vehicle details</h2>
                <p className={styles.modalSub}>Required to confirm your booking</p>
              </div>
              {!booking && <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={16} /></button>}
            </div>

            <div className={styles.modalSummary}>
              <span className={styles.modalSummarySpot}>🅿️ {spot.title}</span>
              <span className={styles.modalSummaryAmt}>₹{total}</span>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className="label">Car / Vehicle number</label>
                <input
                  className={`input ${bErrors.carNumber ? styles.inputErr : ''}`}
                  value={bForm.carNumber}
                  onChange={e => { setBForm(p => ({ ...p, carNumber: e.target.value })); setBErrors(p => ({ ...p, carNumber: '' })) }}
                  placeholder="e.g. DL 01 AB 1234"
                  maxLength={15}
                />
                {bErrors.carNumber && <span className={styles.fieldError}>{bErrors.carNumber}</span>}
              </div>

              <div className={styles.modalField}>
                <label className="label">Vehicle type</label>
                <div className={styles.selectWrap}>
                  <select
                    className={`input ${bErrors.vehicleType ? styles.inputErr : ''}`}
                    value={bForm.vehicleType}
                    onChange={e => { setBForm(p => ({ ...p, vehicleType: e.target.value })); setBErrors(p => ({ ...p, vehicleType: '' })) }}
                  >
                    <option value="">Select vehicle type…</option>
                    {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <ChevronDown size={14} className={styles.selectIcon} />
                </div>
                {bErrors.vehicleType && <span className={styles.fieldError}>{bErrors.vehicleType}</span>}
              </div>

              <div className={styles.modalField}>
                <label className="label">Special instructions <span className={styles.optional}>(optional)</span></label>
                <textarea
                  className="input"
                  value={bForm.specialInstructions}
                  onChange={e => setBForm(p => ({ ...p, specialInstructions: e.target.value }))}
                  placeholder="e.g. I'll arrive 10 mins early, need ground floor…"
                  rows={2}
                  style={{ resize: 'none' }}
                  maxLength={200}
                />
              </div>

              {bookErr && (
                <p className={styles.fieldError} style={{ textAlign: 'center' }}>
                  {bookErr}
                  {bookErr.includes('wallet') && (
                    <> — <a href="/wallet" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Add money →</a></>
                  )}
                </p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className="btn-outline" onClick={() => setShowModal(false)} disabled={booking}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmBooking} disabled={booking} style={{ flex: 2 }}>
                {booking ? 'Confirming…' : `Confirm & Pay ₹${total}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
