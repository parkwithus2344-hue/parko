import { Router, Request, Response } from 'express'
import { connectDB } from '../lib/mongodb'
import Booking from '../models/Booking'
import Parking from '../models/Parking'
import Wallet from '../models/Wallet'
import Transaction from '../models/Transaction'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// GET /api/bookings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const forOwner = req.query.forOwner === 'true'

    let bookings
    if (forOwner && req.user!.role === 'owner') {
      const ownerSpots = await Parking.find({ ownerId: req.user!.userId }).select('_id').lean()
      const spotIds    = ownerSpots.map(s => s._id)
      bookings = await Booking.find({ parkingId: { $in: spotIds } })
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .lean()
    } else {
      bookings = await Booking.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .lean()
    }

    res.json({ bookings })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// POST /api/bookings
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { parkingId, startTime, endTime, carNumber, vehicleType, specialInstructions } = req.body

    if (!parkingId || !startTime || !endTime) {
      res.status(400).json({ error: 'parkingId, startTime, and endTime are required' })
      return
    }
    if (!carNumber || !vehicleType) {
      res.status(400).json({ error: 'Car number and vehicle type are required' })
      return
    }

    const start = new Date(startTime)
    const end   = new Date(endTime)

    if (end <= start) {
      res.status(400).json({ error: 'End time must be after start time' })
      return
    }

    const [spot, wallet] = await Promise.all([
      Parking.findById(parkingId).select('title address pricePerHour ownerId isLive').lean(),
      Wallet.findOne({ userId: req.user!.userId }).select('balance').lean(),
    ])

    if (!spot) {
      res.status(404).json({ error: 'Parking spot not found' })
      return
    }
    if (!spot.isLive) {
      res.status(400).json({ error: 'Parking spot is not available' })
      return
    }
    if (spot.ownerId.toString() === req.user!.userId) {
      res.status(400).json({ error: 'You cannot book your own spot' })
      return
    }

    const hours       = Math.max(0.5, (end.getTime() - start.getTime()) / 3600000)
    const subtotal    = Math.round(hours * spot.pricePerHour)
    const platformFee = 10
    const totalPrice  = subtotal + platformFee

    if (!wallet || wallet.balance < totalPrice) {
      res.status(400).json({
        error: `Insufficient wallet balance. You need ₹${totalPrice} but have ₹${wallet?.balance ?? 0}. Please add money to your wallet first.`,
      })
      return
    }

    const booking = await Booking.create({
      userId:       req.user!.userId,
      parkingId:    spot._id,
      spotTitle:    spot.title,
      spotAddress:  spot.address,
      startTime:    start,
      endTime:      end,
      hours:               Math.round(hours * 10) / 10,
      totalPrice,
      platformFee,
      carNumber:           carNumber.trim().toUpperCase(),
      vehicleType:         vehicleType.trim(),
      specialInstructions: specialInstructions?.trim() || '',
      status:              'confirmed',
      paymentStatus:       'paid',
    })

    await Promise.all([
      Wallet.findOneAndUpdate({ userId: req.user!.userId }, { $inc: { balance: -totalPrice } }),
      Transaction.create({
        userId:      req.user!.userId,
        type:        'debit',
        amount:      totalPrice,
        description: `Booking: ${spot.title}`,
        bookingId:   booking._id,
        status:      'success',
      }),
    ])

    res.status(201).json({ booking })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// PATCH /api/bookings/:id
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' })
      return
    }
    if (booking.userId.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      res.status(400).json({ error: 'Cannot modify a cancelled or completed booking' })
      return
    }

    booking.status = req.body.status
    await booking.save()

    res.json({ booking })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export default router
