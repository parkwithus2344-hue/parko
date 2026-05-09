import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { connectDB } from '../lib/mongodb'
import User from '../models/User'
import Booking from '../models/Booking'
import Parking from '../models/Parking'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// PATCH /api/user/update
router.patch('/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { name, phone, currentPassword, newPassword } = req.body

    const user = await User.findById(req.user!.userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Both current and new password are required' })
        return
      }
      if (newPassword.length < 16) {
        res.status(400).json({ error: 'New password must be at least 16 characters' })
        return
      }
      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
        res.status(400).json({ error: 'New password must contain uppercase, lowercase, and a special character' })
        return
      }
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect' })
        return
      }
      user.password = await bcrypt.hash(newPassword, 12)
    }

    if (name  !== undefined) user.name  = name.trim()
    if (phone !== undefined) user.phone = phone.trim()

    await user.save()

    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, businessName: user.businessName },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// DELETE /api/user/delete
router.delete('/delete', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { password } = req.body
    if (!password) {
      res.status(400).json({ error: 'Password is required' })
      return
    }

    const user = await User.findById(req.user!.userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(400).json({ error: 'Password is incorrect' })
      return
    }

    await Booking.deleteMany({ userId: req.user!.userId })
    if (user.role === 'owner') {
      await Parking.deleteMany({ ownerId: req.user!.userId })
    }
    await User.findByIdAndDelete(req.user!.userId)

    res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export default router
