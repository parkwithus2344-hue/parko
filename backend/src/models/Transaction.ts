import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ITransaction extends Document {
  userId:            Types.ObjectId
  type:              'credit' | 'debit'
  amount:            number
  description:       string
  razorpayOrderId:   string
  razorpayPaymentId: string
  bookingId:         Types.ObjectId | null
  status:            'success' | 'pending' | 'failed'
  createdAt:         Date
  updatedAt:         Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:              { type: String, enum: ['credit', 'debit'], required: true },
    amount:            { type: Number, required: true },
    description:       { type: String, default: '' },
    razorpayOrderId:   { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    bookingId:         { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    status:            { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  },
  { timestamps: true }
)

TransactionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)
