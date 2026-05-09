import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email:  string
  role:   string
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth  = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function ownerOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'owner') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}
