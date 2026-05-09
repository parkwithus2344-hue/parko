import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IBooking extends Document {
  userId:              Types.ObjectId
  parkingId:           Types.ObjectId
  spotTitle:           string
  spotAddress:         string
  startTime:           Date
  endTime:             Date
  hours:               number
  totalPrice:          number
  platformFee:         number
  carNumber:           string
  vehicleType:         string
  specialInstructions: string
  status:              'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus:       'pending' | 'paid' | 'failed'
  createdAt:           Date
  updatedAt:           Date
}

const BookingSchema = new Schema<IBooking>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User',    required: true },
    parkingId:    { type: Schema.Types.ObjectId, ref: 'Parking', required: true },
    spotTitle:           { type: String, required: true },
    spotAddress:         { type: String, required: true },
    startTime:           { type: Date, required: true },
    endTime:             { type: Date, required: true },
    hours:               { type: Number, required: true },
    totalPrice:          { type: Number, required: true },
    platformFee:         { type: Number, default: 10 },
    carNumber:           { type: String, default: '' },
    vehicleType:         { type: String, default: '' },
    specialInstructions: { type: String, default: '' },
    status:              { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'confirmed' },
    paymentStatus:       { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  },
  { timestamps: true }
)

BookingSchema.index({ userId: 1, createdAt: -1 })
BookingSchema.index({ parkingId: 1, createdAt: -1 })

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
