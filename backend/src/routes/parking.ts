import { Router, Request, Response } from 'express'
import { connectDB } from '../lib/mongodb'
import Parking from '../models/Parking'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// GET /api/parking
router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB()

    const { ownerId, search, maxPrice, spotType } = req.query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {}

    if (ownerId) {
      filter.ownerId = ownerId
    } else {
      filter.isLive = true
    }

    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ]
    }

    if (maxPrice) filter.pricePerHour = { $lte: Number(maxPrice) }
    if (spotType && spotType !== 'All') filter.spotType = spotType

    const spots = await Parking.find(filter)
      .select('title pricePerHour spotType address photos amenities isLive ownerId createdAt')
      .sort({ createdAt: -1 })
      .lean()

    res.set('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60')
    res.json({ spots })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// GET /api/parking/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB()
    const spot = await Parking.findById(req.params.id)
    if (!spot) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json({ spot })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// POST /api/parking
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { title, pricePerHour, spotType, description, address, lat, lng, availableFrom, availableTo, days, photos, amenities } = req.body

    if (!title || !pricePerHour || !address) {
      res.status(400).json({ error: 'Title, price, and address are required' })
      return
    }

    const parking = await Parking.create({
      title,
      pricePerHour:  Number(pricePerHour),
      spotType:      spotType      || 'Covered',
      description:   description   || '',
      address,
      lat:           Number(lat)   || 0,
      lng:           Number(lng)   || 0,
      availableFrom: availableFrom || '06:00',
      availableTo:   availableTo   || '22:00',
      days:          days          || [],
      photos:        photos        || [],
      amenities:     amenities     || [],
      ownerId:       req.user!.userId,
      isLive:        true,
    })

    res.status(201).json({ parking })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// PATCH /api/parking/:id
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const spot = await Parking.findById(req.params.id)
    if (!spot) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    if (spot.ownerId.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const ALLOWED = ['title', 'pricePerHour', 'isLive', 'availableFrom', 'availableTo', 'days', 'description', 'amenities', 'spotType']
    const updates: Record<string, unknown> = {}
    for (const key of ALLOWED) {
      if (key in req.body) updates[key] = req.body[key]
    }

    const updated = await Parking.findByIdAndUpdate(req.params.id, updates, { new: true })
    res.json({ spot: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// DELETE /api/parking/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const spot = await Parking.findById(req.params.id)
    if (!spot) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    if (spot.ownerId.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    await Parking.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export default router
