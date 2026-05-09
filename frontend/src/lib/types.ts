export interface DBParkingSpot {
  _id: string
  title: string
  pricePerHour: number
  spotType: string
  description: string
  address: string
  lat: number
  lng: number
  availableFrom: string
  availableTo: string
  days: string[]
  photos: string[]
  amenities: string[]
  ownerId: string
  isLive: boolean
  createdAt: string
  updatedAt: string
}

export interface DBBooking {
  _id: string
  userId: string
  parkingId: string
  spotTitle: string
  spotAddress: string
  startTime: string
  endTime: string
  hours: number
  totalPrice: number
  platformFee: number
  carNumber: string
  vehicleType: string
  specialInstructions: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: string
}

export interface OwnerStats {
  totalEarnings: number
  activeSpots: number
  totalSpots: number
  totalBookings: number
  weeklyBookings: number
  avgRating: number
  totalReviews: number
  earningsGrowth: number
}
