import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { DBParkingSpot } from '../lib/types'
import styles from './SpotCard.module.css'

interface Props {
  spot:   DBParkingSpot
  delay?: number
}

const SpotCard = memo(function SpotCard({ spot, delay = 0 }: Props) {
  return (
    <Link
      to={`/parking/${spot._id}`}
      className={`${styles.card} animate-fadeUp`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={styles.imgWrap}>
        {spot.photos?.[0] ? (
          <img src={spot.photos[0]} alt={spot.title} className={styles.photo} />
        ) : (
          <span className={styles.emoji}>🅿️</span>
        )}
        <span className={`badge ${spot.isLive ? 'badge-available' : 'badge-booked'} ${styles.badge}`}>
          {spot.isLive ? 'Available' : 'Offline'}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{spot.title}</h3>

        <p className={styles.loc}>
          <MapPin size={11} />
          {spot.address}
        </p>

        <div className={styles.tags}>
          <span className={styles.tag}>{spot.spotType}</span>
          {spot.amenities.slice(0, 1).map(a => (
            <span key={a} className={styles.tag}>{a}</span>
          ))}
        </div>

        <div className={styles.foot}>
          <div className={styles.price}>
            ₹{spot.pricePerHour}
            <span>/hr</span>
          </div>
          <div className={styles.rating}>
            <Star size={11} fill="#ffb830" color="#ffb830" />
            4.5
          </div>
        </div>
      </div>
    </Link>
  )
})

export default SpotCard
