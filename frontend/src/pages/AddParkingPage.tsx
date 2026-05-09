import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Check, X, Loader2, Lock, ShieldCheck, MapPin, Building2, Sparkles } from 'lucide-react'
import { getToken, getUser, saveAuth } from '../lib/auth'
import { apiFetch, API_BASE } from '../lib/api'
import styles from './add-parking.module.css'

const AMENITIES  = ['CCTV', 'EV Charging', '24/7 Access', 'Washroom', 'Wheelchair accessible', 'Security guard', 'Valet', 'Gated']
const SPOT_TYPES = ['Covered', 'Open Air', 'Underground', 'Valet', 'Rooftop']
const DAYS       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STEPS      = ['Basic info', 'Location', 'Schedule & photos', 'Amenities']

interface FormState {
  title:         string
  pricePerHour:  string
  spotType:      string
  description:   string
  street:        string
  city:          string
  state:         string
  availableFrom: string
  availableTo:   string
}

type StepErrors = Partial<Record<keyof FormState | 'days' | 'photos', string>>
type ModalPhase = 'listing' | 'upgrading' | 'done'

function TransferModal({ phase, userName }: { phase: ModalPhase; userName: string }) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (phase !== 'done') return
    const id = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  return (
    <>
      <div className={styles.modalBackdrop} />
      <div className={styles.transferModal}>

        <div className={`${styles.phase} ${phase === 'listing' ? styles.phaseVisible : styles.phaseHidden}`}>
          <div className={styles.orbitWrap}>
            <div className={styles.orbit} />
            <div className={styles.orbitInner}><MapPin size={28} strokeWidth={2} /></div>
          </div>
          <h2 className={styles.modalTitle}>Creating your listing…</h2>
          <p className={styles.modalSub}>Uploading spot details to ParkSpot</p>
          <div className={styles.dotRow}>
            <span className={styles.dot} style={{ animationDelay: '0s'   }} />
            <span className={styles.dot} style={{ animationDelay: '0.2s' }} />
            <span className={styles.dot} style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        <div className={`${styles.phase} ${phase === 'upgrading' ? styles.phaseVisible : styles.phaseHidden}`}>
          <div className={styles.transferRow}>
            <div className={styles.transferNode}>
              <div className={`${styles.nodeCircle} ${styles.nodeUser}`}>
                <span className={styles.nodeAvatar}>{userName.charAt(0).toUpperCase()}</span>
              </div>
              <span className={styles.nodeLabel}>User</span>
            </div>
            <div className={styles.transferPath}>
              <div className={styles.pathLine} />
              <div className={styles.pathPulse} />
              <div className={styles.arrowHead} />
            </div>
            <div className={styles.transferNode}>
              <div className={`${styles.nodeCircle} ${styles.nodeOwner}`}>
                <Building2 size={22} strokeWidth={2} />
              </div>
              <span className={styles.nodeLabel}>Owner</span>
            </div>
          </div>
          <h2 className={styles.modalTitle}>Upgrading your account…</h2>
          <p className={styles.modalSub}>Granting owner permissions</p>
          <div className={styles.dotRow}>
            <span className={styles.dot} style={{ animationDelay: '0s'   }} />
            <span className={styles.dot} style={{ animationDelay: '0.2s' }} />
            <span className={styles.dot} style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        <div className={`${styles.phase} ${phase === 'done' ? styles.phaseVisible : styles.phaseHidden}`}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
          ))}
          <div className={styles.successRing}>
            <div className={styles.successCircle}><Check size={32} strokeWidth={3} /></div>
          </div>
          <div className={styles.ownerBadge}><Sparkles size={13} />You&apos;re now an Owner</div>
          <h2 className={styles.modalTitle}>Listing live!</h2>
          <p className={styles.modalSub}>Your spot is now on ParkSpot</p>
          <div className={styles.redirectBar}>
            <div className={styles.redirectFill} />
          </div>
          <p className={styles.redirectText}>Redirecting to dashboard in {countdown}s…</p>
        </div>

      </div>
    </>
  )
}

export default function AddParkingPage() {
  const navigate = useNavigate()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [step,          setStep]          = useState(0)
  const [amenities,     setAmenities]     = useState<string[]>(['CCTV'])
  const [days,          setDays]          = useState<string[]>([])
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState('')
  const [stepErrors,    setStepErrors]    = useState<StepErrors>({})
  const [showCctvPopup, setShowCctvPopup] = useState(false)
  const [modalPhase,    setModalPhase]    = useState<ModalPhase | null>(null)

  const [form, setForm] = useState<FormState>({
    title:         '',
    pricePerHour:  '',
    spotType:      'Covered',
    description:   '',
    street:        '',
    city:          '',
    state:         '',
    availableFrom: '06:00',
    availableTo:   '22:00',
  })

  const [photos,         setPhotos]         = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadError,    setUploadError]    = useState('')
  const [previewUrls,    setPreviewUrls]    = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setStepErrors(prev => ({ ...prev, [name]: '' }))
  }

  const toggleAmenity = (a: string) => {
    if (a === 'CCTV') {
      setShowCctvPopup(true)
      setTimeout(() => setShowCctvPopup(false), 2500)
      return
    }
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const toggleDay = (d: string) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
    setStepErrors(prev => ({ ...prev, days: '' }))
  }

  const validateStep = (): boolean => {
    const errs: StepErrors = {}
    if (step === 0) {
      if (!form.title.trim())                       errs.title        = 'Spot title is required'
      else if (form.title.trim().length < 5)        errs.title        = 'Title must be at least 5 characters'
      if (!form.pricePerHour)                       errs.pricePerHour = 'Price per hour is required'
      else if (Number(form.pricePerHour) <= 0)      errs.pricePerHour = 'Price must be greater than ₹0'
      if (!form.description.trim())                 errs.description  = 'Description is required'
      else if (form.description.trim().length < 20) errs.description  = 'Description must be at least 20 characters'
    }
    if (step === 1) {
      if (!form.street.trim()) errs.street = 'Street address is required'
      if (!form.city.trim())   errs.city   = 'City is required'
      if (!form.state.trim())  errs.state  = 'State is required'
    }
    if (step === 2) {
      if (days.length === 0) errs.days   = 'Select at least one available day'
      if (photos.length < 3) errs.photos = `At least 3 photos are required (${photos.length}/3 uploaded)`
    }
    setStepErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => { if (validateStep()) setStep(s => s + 1) }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingPhoto(true)
    setUploadError('')

    for (const file of Array.from(files)) {
      try {
        const jwtToken = localStorage.getItem('parkspot_token')
        const formData = new FormData()
        formData.append('file', file)

        const uploadRes = await fetch(`${API_BASE}/api/imagekit/upload`, {
          method:  'POST',
          headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {},
          body:    formData,
        })

        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'Upload failed')
        }

        const data = await uploadRes.json()
        setPhotos(prev      => [...prev, data.url])
        setPreviewUrls(prev => [...prev, data.url])
        setStepErrors(prev  => ({ ...prev, photos: '' }))
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      }
    }

    setUploadingPhoto(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev      => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const token = getToken()
      const user  = getUser()
      if (!token || !user) { navigate('/login'); return }

      setModalPhase('listing')
      await new Promise(r => setTimeout(r, 1200))

      const fullAddress = [form.street, form.city, form.state].filter(Boolean).join(', ')

      const res = await apiFetch('/api/parking', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title, pricePerHour: form.pricePerHour, spotType: form.spotType,
          description: form.description, address: fullAddress,
          availableFrom: form.availableFrom, availableTo: form.availableTo,
          days, photos, amenities,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setModalPhase(null)
        setSubmitError(data.error || 'Failed to submit listing')
        setSubmitting(false)
        return
      }

      if (user.role !== 'owner') {
        setModalPhase('upgrading')
        await new Promise(r => setTimeout(r, 1400))

        const ownerRes  = await apiFetch('/api/auth/become-owner', {
          method: 'PATCH',
          body:   JSON.stringify({}),
        })
        const ownerData = await ownerRes.json()
        if (ownerRes.ok) {
          saveAuth(ownerData.token, ownerData.user)
        }
      }

      setModalPhase('done')
      await new Promise(r => setTimeout(r, 3200))

      navigate('/owner/dashboard')
    } catch {
      setModalPhase(null)
      setSubmitError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const progress  = ((step + 1) / STEPS.length) * 100
  const user      = getUser()
  const userName  = user?.name || 'U'

  void API_BASE

  return (
    <div className="page-wrapper" style={{ maxWidth: 680 }}>
      <h1 className="page-title animate-fadeUp">List your parking spot</h1>
      <p className="page-subtitle animate-fadeUp delay-1">Fill in the details and start earning</p>

      <div className={`${styles.progressWrap} animate-fadeUp delay-1`}>
        <div className={styles.stepLabels}>
          {STEPS.map((s, i) => (
            <span key={s} className={`${styles.stepLabel} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}>
              {i < step ? <Check size={11} /> : i + 1}
              <span className={styles.stepText}>{s}</span>
            </span>
          ))}
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 0 && (
        <div className={`card ${styles.stepCard} animate-fadeUp`}>
          <div className={styles.field}>
            <label className="label">Spot title</label>
            <input className={`input ${stepErrors.title ? styles.inputErr : ''}`} name="title" value={form.title} onChange={handleChange} placeholder="e.g. Central Park Basement B2" />
            {stepErrors.title && <span className={styles.fieldError}>{stepErrors.title}</span>}
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className="label">Price per hour (₹)</label>
              <input className={`input ${stepErrors.pricePerHour ? styles.inputErr : ''}`} type="number" name="pricePerHour" value={form.pricePerHour} onChange={handleChange} placeholder="80" min="1" />
              {stepErrors.pricePerHour && <span className={styles.fieldError}>{stepErrors.pricePerHour}</span>}
            </div>
            <div className={styles.field}>
              <label className="label">Spot type</label>
              <select className="input" name="spotType" value={form.spotType} onChange={handleChange}>
                {SPOT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Description</label>
            <textarea className={`input ${stepErrors.description ? styles.inputErr : ''}`} name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe your spot — nearby landmarks, entry instructions… (min 20 chars)" style={{ resize: 'vertical' }} />
            {stepErrors.description && <span className={styles.fieldError}>{stepErrors.description}</span>}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={`card ${styles.stepCard} animate-fadeUp`}>
          <div className={styles.field}>
            <label className="label">Street address</label>
            <input className={`input ${stepErrors.street ? styles.inputErr : ''}`} name="street" value={form.street} onChange={handleChange} placeholder="e.g. B-12, Connaught Place" />
            {stepErrors.street && <span className={styles.fieldError}>{stepErrors.street}</span>}
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className="label">City</label>
              <input className={`input ${stepErrors.city ? styles.inputErr : ''}`} name="city" value={form.city} onChange={handleChange} placeholder="e.g. New Delhi" />
              {stepErrors.city && <span className={styles.fieldError}>{stepErrors.city}</span>}
            </div>
            <div className={styles.field}>
              <label className="label">State</label>
              <input className={`input ${stepErrors.state ? styles.inputErr : ''}`} name="state" value={form.state} onChange={handleChange} placeholder="e.g. Delhi" />
              {stepErrors.state && <span className={styles.fieldError}>{stepErrors.state}</span>}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={`card ${styles.stepCard} animate-fadeUp`}>
          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className="label">Available from</label>
              <input className="input" type="time" name="availableFrom" value={form.availableFrom} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label className="label">Available until</label>
              <input className="input" type="time" name="availableTo" value={form.availableTo} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Days available</label>
            <div className={styles.dayRow}>
              {DAYS.map(d => (
                <button key={d} className={`${styles.dayChip} ${days.includes(d) ? styles.dayOn : ''}`} type="button" onClick={() => toggleDay(d)}>{d}</button>
              ))}
            </div>
            {stepErrors.days && <span className={styles.fieldError}>{stepErrors.days}</span>}
          </div>

          <div className={styles.field}>
            <div className={styles.photoLabelRow}>
              <label className="label" style={{ margin: 0 }}>Spot photos</label>
              <span className={`${styles.photoCount} ${photos.length >= 3 ? styles.photoCountMet : ''}`}>
                {photos.length}/3 minimum
              </span>
            </div>

            {previewUrls.length > 0 && (
              <div className={styles.photoGrid}>
                {previewUrls.map((url, i) => (
                  <div key={i} className={styles.photoThumb}>
                    <img src={url} alt={`Spot photo ${i + 1}`} />
                    <button type="button" className={styles.removePhoto} onClick={() => removePhoto(i)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className={`${styles.uploadZone} ${uploadingPhoto ? styles.uploading : ''}`}>
              {uploadingPhoto ? (
                <><Loader2 size={24} className={styles.spin} /><span>Uploading to ImageKit…</span></>
              ) : (
                <>
                  <Upload size={24} />
                  <span>Click or drag images here</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>JPG, PNG up to 10MB · Multiple allowed</span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} disabled={uploadingPhoto} />
            </label>

            {uploadError       && <p className={styles.fieldError}>{uploadError}</p>}
            {stepErrors.photos && <p className={styles.fieldError}>{stepErrors.photos}</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={`card ${styles.stepCard} animate-fadeUp`} style={{ position: 'relative' }}>
          <p className={styles.amenityHint}>Select all that apply to your spot</p>
          <div className={styles.amenityGrid}>
            {AMENITIES.map(a => {
              const isCctv    = a === 'CCTV'
              const isChecked = amenities.includes(a)
              return (
                <button
                  key={a}
                  className={`${styles.amenityChip} ${isChecked ? styles.amenityOn : ''} ${isCctv ? styles.amenityCctv : ''}`}
                  onClick={() => toggleAmenity(a)}
                  type="button"
                >
                  {isCctv ? <Lock size={12} /> : isChecked ? <Check size={12} /> : null}
                  {a}
                  {isCctv && <span className={styles.cctvBadge}>Required</span>}
                </button>
              )
            })}
          </div>

          {showCctvPopup && (
            <div className={`${styles.cctvPopup} animate-fadeUp`}>
              <ShieldCheck size={14} />
              CCTV is mandatory for all listed spots
            </div>
          )}

          {submitError && (
            <p style={{ color: 'var(--danger,#ef4444)', fontSize: '0.85rem', marginTop: 8, textAlign: 'center' }}>
              {submitError}
            </p>
          )}
        </div>
      )}

      <div className={styles.navRow}>
        {step > 0 ? <button className="btn-outline" onClick={() => setStep(s => s - 1)}>← Back</button> : <span />}
        {step < STEPS.length - 1 ? (
          <button className={`btn-primary ${styles.nextBtn}`} onClick={handleNext}>Continue →</button>
        ) : (
          <button className={`btn-primary ${styles.nextBtn}`} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 size={14} className={styles.spin} /> Submitting…</> : 'Submit listing ✓'}
          </button>
        )}
      </div>

      {modalPhase && <TransferModal phase={modalPhase} userName={userName} />}
    </div>
  )
}
