import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '../lib/mongodb'
import User from '../models/User'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { name, email, phone, password, role, businessName } = req.body

    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'All fields are required' })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }

    const existing = await User.findOne({ email })
    if (existing) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({
      name, email, phone,
      password: hashedPassword,
      role: role || 'user',
      businessName: role === 'owner' ? businessName : undefined,
    })

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, businessName: user.businessName },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, businessName: user.businessName },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// PATCH /api/auth/become-owner
router.patch('/become-owner', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { businessName } = req.body

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { role: 'owner', ...(businessName ? { businessName } : {}) },
      { new: true }
    )

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const newToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      token: newToken,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, businessName: user.businessName },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export default router
