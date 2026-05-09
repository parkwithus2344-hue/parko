type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

interface Props {
  status: BookingStatus
}

const labels: Record<BookingStatus, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`badge badge-${status}`}>
      {labels[status]}
    </span>
  )
}
