import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { connectDB } from '../lib/mongodb'
import Wallet from '../models/Wallet'
import Transaction from '../models/Transaction'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// GET /api/wallet
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    await connectDB()
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({ userId: req.user!.userId }).select('balance').lean(),
      Transaction.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(30).lean(),
    ])

    res.json({ balance: wallet?.balance ?? 0, transactions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// POST /api/wallet/add
router.post('/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body

    if (!amount || isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum add amount is ₹10' })
      return
    }
    if (amount > 50000) {
      res.status(400).json({ error: 'Maximum add amount is ₹50,000' })
      return
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      res.status(500).json({ error: 'Payment gateway not configured' })
      return
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await razorpay.orders.create({
      amount:   Math.round(amount) * 100,
      currency: 'INR',
      receipt:  `w_${Date.now()}`,
    })

    res.json({
      orderId:  order.id,
      amount:   Math.round(amount),
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('[wallet/add]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// POST /api/wallet/verify
router.post('/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !amount) {
      res.status(400).json({ error: 'Missing payment details' })
      return
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      res.status(400).json({ error: 'Payment verification failed' })
      return
    }

    await connectDB()

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user!.userId },
      { $inc: { balance: amount } },
      { upsert: true, new: true }
    )

    await Transaction.create({
      userId:            req.user!.userId,
      type:              'credit',
      amount,
      description:       'Added to wallet via Razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      status:            'success',
    })

    res.json({ balance: wallet.balance })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export default router
