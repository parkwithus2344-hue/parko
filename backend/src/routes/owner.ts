import { Router, Request, Response } from 'express'
import { connectDB } from '../lib/mongodb'
import Parking from '../models/Parking'
import Booking from '../models/Booking'
import { authMiddleware, ownerOnly } from '../middleware/auth'

const router = Router()

// GET /api/owner/stats
router.get('/stats', authMiddleware, ownerOnly, async (req: Request, res: Response) => {
  try {
    await connectDB()

    const spots   = await Parking.find({ ownerId: req.user!.userId })
    const spotIds = spots.map(s => s._id)

    const allBookings       = await Booking.find({ parkingId: { $in: spotIds } })
    const confirmedBookings = allBookings.filter(b => ['confirmed', 'completed'].includes(b.status))
    const totalEarnings     = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0)

    const weekAgo        = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyBookings = allBookings.filter(b => new Date(b.createdAt) >= weekAgo).length

    res.json({
      stats: {
        totalEarnings,
        activeSpots:    spots.filter(s => s.isLive).length,
        totalSpots:     spots.length,
        totalBookings:  allBookings.length,
        weeklyBookings,
        avgRating:      4.7,
        totalReviews:   confirmedBookings.length,
        earningsGrowth: 0,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export default router
