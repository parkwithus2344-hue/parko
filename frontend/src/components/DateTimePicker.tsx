import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar } from 'lucide-react'
import styles from './date-time-picker.module.css'

interface Props {
  label:    string
  value:    string
  onChange: (v: string) => void
  min?:     string
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_ABBR    = ['Su','Mo','Tu','We','Th','Fr','Sa']
const DISP_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DISP_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MINUTE_OPTS = [0, 15, 30, 45]

function pad(n: number) { return String(n).padStart(2, '0') }

function toISO(y: number, m: number, d: number, h: number, min: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}T${pad(h)}:${pad(min)}`
}

function formatDisplay(iso: string) {
  const dt = new Date(iso)
  const h  = dt.getHours()
  const m  = dt.getMinutes()
  const h12 = h % 12 || 12
  return `${DISP_DAYS[dt.getDay()]}, ${dt.getDate()} ${DISP_MONTHS[dt.getMonth()]} · ${pad(h12)}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function DateTimePicker({ label, value, onChange, min }: Props) {
  const now     = new Date()
  const parsed  = value ? new Date(value) : null

  const [open,      setOpen]      = useState(false)
  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear()  ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? now.getMonth())
  const [selDate,   setSelDate]   = useState<{ y: number; m: number; d: number } | null>(
    parsed ? { y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate() } : null
  )
  const [hour,   setHour]   = useState(parsed?.getHours()   ?? now.getHours())
  const [minute, setMinute] = useState(
    parsed ? MINUTE_OPTS.reduce((a, b) => Math.abs(b - parsed.getMinutes()) < Math.abs(a - parsed.getMinutes()) ? b : a) : 0
  )

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  const emit = useCallback((d: { y: number; m: number; d: number } | null, h: number, min: number) => {
    if (!d) return
    onChange(toISO(d.y, d.m, d.d, h, min))
  }, [onChange])

  const positionPanel = useCallback(() => {
    if (!triggerRef.current) return
    const r           = triggerRef.current.getBoundingClientRect()
    const panelH      = 380
    const panelW      = 290
    const spaceBelow  = window.innerHeight - r.bottom
    const top         = spaceBelow >= panelH + 8
      ? r.bottom + window.scrollY + 6
      : r.top    + window.scrollY - panelH - 6
    const left = Math.min(
      r.left + window.scrollX,
      window.innerWidth + window.scrollX - panelW - 12
    )
    setPanelStyle({ top, left, width: panelW })
  }, [])

  const openPanel = () => {
    positionPanel()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (
        panelRef.current   && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Calendar grid
  const firstDOW    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDOW).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const minDate = min ? new Date(min) : null

  const isDayDisabled = (d: number) => {
    if (!minDate) return false
    return new Date(viewYear, viewMonth, d, 23, 59) < minDate
  }
  const isDaySelected = (d: number) =>
    !!selDate && selDate.y === viewYear && selDate.m === viewMonth && selDate.d === d
  const isDayToday = (d: number) =>
    now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d

  const prevMonth = () => viewMonth === 0  ? (setViewYear(y => y - 1), setViewMonth(11)) : setViewMonth(m => m - 1)
  const nextMonth = () => viewMonth === 11 ? (setViewYear(y => y + 1), setViewMonth(0))  : setViewMonth(m => m + 1)

  const selectDay = (d: number) => {
    const nd = { y: viewYear, m: viewMonth, d }
    setSelDate(nd)
    emit(nd, hour, minute)
  }

  const changeHour = (h: number) => {
    setHour(h)
    emit(selDate, h, minute)
  }
  const changeMinute = (min: number) => {
    setMinute(min)
    emit(selDate, hour, min)
  }

  const incHour   = () => changeHour((hour + 1) % 24)
  const decHour   = () => changeHour((hour - 1 + 24) % 24)
  const incMinute = () => changeMinute(MINUTE_OPTS[(MINUTE_OPTS.indexOf(minute) + 1) % MINUTE_OPTS.length])
  const decMinute = () => changeMinute(MINUTE_OPTS[(MINUTE_OPTS.indexOf(minute) - 1 + MINUTE_OPTS.length) % MINUTE_OPTS.length])

  return (
    <div className={styles.wrap}>
      <label className="label">{label}</label>
      <button
        ref={triggerRef}
        type="button"
        className={`input ${styles.trigger} ${value ? styles.hasValue : ''}`}
        onClick={openPanel}
      >
        <Calendar size={14} className={styles.triggerIcon} />
        {value
          ? <span>{formatDisplay(value)}</span>
          : <span className={styles.placeholder}>Pick date & time</span>
        }
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className={styles.panel}
          style={{ ...panelStyle, position: 'absolute' }}
        >
          {/* Month navigation */}
          <div className={styles.calHead}>
            <button type="button" className={styles.navBtn} onClick={prevMonth}>
              <ChevronLeft size={15} />
            </button>
            <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" className={styles.navBtn} onClick={nextMonth}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className={styles.dowRow}>
            {DAY_ABBR.map(d => <span key={d}>{d}</span>)}
          </div>

          {/* Day grid */}
          <div className={styles.dayGrid}>
            {cells.map((day, i) =>
              day === null ? (
                <span key={`_${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDayDisabled(day)}
                  className={[
                    styles.dayBtn,
                    isDaySelected(day) ? styles.daySelected : '',
                    isDayToday(day) && !isDaySelected(day) ? styles.dayToday : '',
                    isDayDisabled(day) ? styles.dayDisabled : '',
                  ].join(' ')}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              )
            )}
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Time picker */}
          <div className={styles.timeArea}>
            <span className={styles.timeLabel}>Time</span>
            <div className={styles.timeControls}>
              {/* Hour */}
              <div className={styles.spinCol}>
                <button type="button" className={styles.spinBtn} onClick={incHour}><ChevronUp   size={13} /></button>
                <span className={styles.spinVal}>{pad(hour)}</span>
                <button type="button" className={styles.spinBtn} onClick={decHour}><ChevronDown size={13} /></button>
              </div>

              <span className={styles.timeSep}>:</span>

              {/* Minute */}
              <div className={styles.spinCol}>
                <button type="button" className={styles.spinBtn} onClick={incMinute}><ChevronUp   size={13} /></button>
                <span className={styles.spinVal}>{pad(minute)}</span>
                <button type="button" className={styles.spinBtn} onClick={decMinute}><ChevronDown size={13} /></button>
              </div>

              <span className={styles.ampm}>{hour >= 12 ? 'PM' : 'AM'}</span>
            </div>
          </div>

          {/* Done */}
          <button
            type="button"
            className={`btn-primary ${styles.doneBtn}`}
            onClick={() => setOpen(false)}
            disabled={!selDate}
          >
            {selDate ? 'Done' : 'Select a date first'}
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}
