import { useState, useEffect, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import SpotCard from '../components/SpotCard'
import { DBParkingSpot } from '../lib/types'
import { apiFetch } from '../lib/api'
import styles from './search.module.css'

const FILTERS = ['All', '< ₹50/hr', 'Covered', 'Open Air', 'Underground', 'EV Charging', '24/7 Access']

export default function SearchPage() {
  const [spots,      setSpots]      = useState<DBParkingSpot[]>([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [filter,     setFilter]     = useState('All')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    apiFetch('/api/parking')
      .then(r => r.json())
      .then(d => setSpots(d.spots || []))
      .catch(() => setSpots([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => spots.filter(s => {
    const q      = debouncedQ.toLowerCase()
    const matchQ = !q || s.title.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    const matchF =
      filter === 'All'                                         ? true :
      filter === '< ₹50/hr'                                   ? s.pricePerHour < 50 :
      ['Covered', 'Open Air', 'Underground'].includes(filter) ? s.spotType === filter :
      s.amenities.some(a => a === filter)
    return matchQ && matchF
  }), [spots, debouncedQ, filter])

  return (
    <div className="page-wrapper">
      <div className={`${styles.hero} animate-fadeUp`}>
        <h1 className={styles.heroTitle}>Find your <span>perfect</span> spot</h1>
        <p className={styles.heroSub}>Search from verified parking spots across the city</p>
      </div>

      <div className={`${styles.searchBar} animate-fadeUp delay-1`}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search by location, landmark or area…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className={styles.filterBtn}>
          <SlidersHorizontal size={14} />Filters
        </button>
      </div>

      <div className={`${styles.filterRow} animate-fadeUp delay-2`}>
        {FILTERS.map(f => (
          <button key={f} className={`${styles.chip} ${filter === f ? styles.chipOn : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>Loading spots…</p>
      ) : (
        <>
          <p className={styles.count}>{filtered.length} spot{filtered.length !== 1 ? 's' : ''} found</p>
          {filtered.length > 0 ? (
            <div className={styles.grid}>
              {filtered.map((spot, i) => <SpotCard key={spot._id} spot={spot} delay={i * 0.06} />)}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🅿️</div>
              <h3>No spots found</h3>
              <p>Try a different search or clear the filter</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
