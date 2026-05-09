import { useState } from 'react'
import { X, Pencil, CircleCheck, CircleOff, BadgeDollarSign, Clock3, BarChart2, Trash2 } from 'lucide-react'
import { DBParkingSpot } from '../lib/types'
import { apiFetch } from '../lib/api'
import styles from './EditSpotModal.module.css'

interface Props {
  spot:     DBParkingSpot
  isOpen:   boolean
  onClose:  () => void
  onUpdate: (updated: DBParkingSpot) => void
  onDelete: (id: string) => void
}

type ActivePane = null | 'rename' | 'price' | 'hours'

export default function EditSpotModal({ spot, isOpen, onClose, onUpdate, onDelete }: Props) {
  const [activePane, setActivePane] = useState<ActivePane>(null)
  const [newTitle,   setNewTitle]   = useState(spot.title)
  const [newPrice,   setNewPrice]   = useState(String(spot.pricePerHour))
  const [fromTime,   setFromTime]   = useState(spot.availableFrom)
  const [toTime,     setToTime]     = useState(spot.availableTo)
  const [days,       setDays]       = useState<string[]>(spot.days || [])
  const [toast,      setToast]      = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)

  if (!isOpen) return null

  const apiPatch = async (body: object): Promise<DBParkingSpot> => {
    const res  = await apiFetch(`/api/parking/${spot._id}`, {
      method: 'PATCH',
      body:   JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Update failed')
    return data.spot as DBParkingSpot
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleClose = () => { setActivePane(null); onClose() }

  const handleRename = async () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const updated = await apiPatch({ title: trimmed })
      onUpdate(updated); setActivePane(null); showToast('Spot renamed successfully')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handlePriceChange = async () => {
    const parsed = parseFloat(newPrice)
    if (isNaN(parsed) || parsed <= 0) return
    setSaving(true)
    try {
      const updated = await apiPatch({ pricePerHour: parsed })
      onUpdate(updated); setActivePane(null); showToast('Price updated successfully')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (isLive: boolean) => {
    setSaving(true)
    try {
      const updated = await apiPatch({ isLive })
      onUpdate(updated); showToast(isLive ? 'Spot is now live' : 'Spot turned off')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleHours = async () => {
    setSaving(true)
    try {
      const updated = await apiPatch({ availableFrom: fromTime, availableTo: toTime, days })
      onUpdate(updated); setActivePane(null); showToast('Hours updated successfully')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${spot.title}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/parking/${spot._id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onDelete(spot._id); handleClose()
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed to delete') }
    finally { setSaving(false) }
  }

  const toggleDay  = (d: string) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const togglePane = (pane: ActivePane) => setActivePane(prev => prev === pane ? null : pane)

  const OPTIONS = [
    { key: 'rename' as ActivePane, icon: <Pencil size={20} />,          title: 'Rename spot',    sub: 'Update the display name',           tag: 'Listing',  variant: 'default', onClick: () => togglePane('rename') },
    { key: null,                   icon: <CircleCheck size={20} />,     title: 'Set live',       sub: 'Make this spot visible & bookable', tag: 'Active',   variant: 'green',   onClick: () => handleStatusChange(true) },
    { key: null,                   icon: <CircleOff size={20} />,       title: 'Turn off',       sub: 'Hide from search results',          tag: 'Paused',   variant: 'red',     onClick: () => handleStatusChange(false) },
    { key: 'price' as ActivePane,  icon: <BadgeDollarSign size={20} />, title: 'Change price',   sub: 'Update the hourly rate',            tag: 'Pricing',  variant: 'amber',   onClick: () => togglePane('price') },
    { key: 'hours' as ActivePane,  icon: <Clock3 size={20} />,          title: 'Edit hours',     sub: 'Change available days & time slots',tag: 'Schedule', variant: 'blue',    onClick: () => togglePane('hours') },
    { key: null,                   icon: <BarChart2 size={20} />,       title: 'View analytics', sub: 'See views, bookings and earnings',  tag: 'Insights', variant: 'default', onClick: () => showToast('Analytics coming soon!') },
  ]

  return (
    <>
      <div className={styles.backdrop} onClick={handleClose} />
      <div className={`${styles.modal} animate-fadeUp`}>

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.headerEmoji}>🅿️</span>
            <div>
              <h2 className={styles.headerTitle}>{spot.title}</h2>
              <p className={styles.headerSub}>Choose what you want to update</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} disabled={saving} aria-label="Close"><X size={16} /></button>
        </div>

        <div className={styles.grid}>
          {OPTIONS.map((opt, i) => (
            <button
              key={i}
              className={`${styles.option} ${styles[`option_${opt.variant}`]} ${activePane === opt.key && opt.key ? styles.optionActive : ''}`}
              onClick={opt.onClick}
              disabled={saving}
            >
              <span className={`${styles.optIcon} ${styles[`icon_${opt.variant}`]}`}>{opt.icon}</span>
              <span className={styles.optTitle}>{opt.title}</span>
              <span className={styles.optSub}>{opt.sub}</span>
              <span className={`${styles.optTag} ${styles[`tag_${opt.variant}`]}`}>{opt.tag}</span>
            </button>
          ))}
        </div>

        {activePane === 'rename' && (
          <div className={`${styles.pane} animate-fadeIn`}>
            <label className="label">New spot name</label>
            <div className={styles.paneRow}>
              <input className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} placeholder="Enter new spot name…" autoFocus />
              <button className={styles.saveBtn} onClick={handleRename} disabled={saving}>{saving ? '…' : 'Save'}</button>
              <button className={styles.cancelBtn} onClick={() => setActivePane(null)}>Cancel</button>
            </div>
          </div>
        )}

        {activePane === 'price' && (
          <div className={`${styles.pane} animate-fadeIn`}>
            <label className="label">New price per hour (₹)</label>
            <div className={styles.paneRow}>
              <input className="input" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePriceChange()} placeholder="e.g. 100" min="10" autoFocus />
              <button className={styles.saveBtn} onClick={handlePriceChange} disabled={saving}>{saving ? '…' : 'Update'}</button>
              <button className={styles.cancelBtn} onClick={() => setActivePane(null)}>Cancel</button>
            </div>
          </div>
        )}

        {activePane === 'hours' && (
          <div className={`${styles.pane} animate-fadeIn`}>
            <label className="label">Available hours</label>
            <div className={styles.timeRow}>
              <div className={styles.timeField}>
                <span className={styles.timeLabel}>From</span>
                <input className="input" type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} />
              </div>
              <div className={styles.timeSep}>→</div>
              <div className={styles.timeField}>
                <span className={styles.timeLabel}>Until</span>
                <input className="input" type="time" value={toTime} onChange={e => setToTime(e.target.value)} />
              </div>
            </div>
            <label className={`label ${styles.daysLabel}`}>Days available</label>
            <div className={styles.daysRow}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <button key={d} className={`${styles.dayChip} ${days.includes(d) ? styles.dayChipOn : ''}`} onClick={() => toggleDay(d)} type="button">{d}</button>
              ))}
            </div>
            <div className={styles.paneActions}>
              <button className={styles.saveBtn} onClick={handleHours} disabled={saving}>{saving ? 'Saving…' : 'Save hours'}</button>
              <button className={styles.cancelBtn} onClick={() => setActivePane(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
            <Trash2 size={14} />
            Delete listing
          </button>
        </div>
      </div>

      {toast && <div className={`${styles.toast} animate-slideDown`}>{toast}</div>}
    </>
  )
}
