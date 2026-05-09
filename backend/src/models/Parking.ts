import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IParking extends Document {
  title:         string
  pricePerHour:  number
  spotType:      string
  description:   string
  address:       string
  lat:           number
  lng:           number
  availableFrom: string
  availableTo:   string
  days:          string[]
  photos:        string[]
  amenities:     string[]
  ownerId:       Types.ObjectId
  isLive:        boolean
  createdAt:     Date
  updatedAt:     Date
}

const ParkingSchema = new Schema<IParking>(
  {
    title:         { type: String, required: true, trim: true },
    pricePerHour:  { type: Number, required: true, min: 0 },
    spotType:      { type: String, required: true },
    description:   { type: String, default: '' },
    address:       { type: String, required: true },
    lat:           { type: Number, default: 0 },
    lng:           { type: Number, default: 0 },
    availableFrom: { type: String, default: '06:00' },
    availableTo:   { type: String, default: '22:00' },
    days:          { type: [String], default: [] },
    photos:        { type: [String], default: [] },
    amenities:     { type: [String], default: [] },
    ownerId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isLive:        { type: Boolean, default: true },
  },
  { timestamps: true }
)

ParkingSchema.index({ isLive: 1, createdAt: -1 })
ParkingSchema.index({ ownerId: 1, createdAt: -1 })
ParkingSchema.index({ title: 'text', address: 'text' })

export default mongoose.models.Parking || mongoose.model<IParking>('Parking', ParkingSchema)
