import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes     from './routes/auth'
import parkingRoutes  from './routes/parking'
import bookingRoutes  from './routes/bookings'
import walletRoutes   from './routes/wallet'
import userRoutes     from './routes/user'
import ownerRoutes    from './routes/owner'
import imagekitRoutes from './routes/imagekit'

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.use(rateLimit({ windowMs: 60_000, max: 100 }))

const authLimiter = rateLimit({ windowMs: 60_000, max: 10 })
app.use('/api/auth/login',    authLimiter)
app.use('/api/auth/register', rateLimit({ windowMs: 60_000, max: 5 }))
app.use('/api/wallet/add',    rateLimit({ windowMs: 60_000, max: 10 }))
app.use('/api/wallet/verify', rateLimit({ windowMs: 60_000, max: 10 }))

app.use('/api/auth',     authRoutes)
app.use('/api/parking',  parkingRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/wallet',   walletRoutes)
app.use('/api/user',     userRoutes)
app.use('/api/owner',    ownerRoutes)
app.use('/api/imagekit', imagekitRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

export default app
