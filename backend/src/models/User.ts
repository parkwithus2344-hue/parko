import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  phone: string
  password: string
  role: 'user' | 'owner'
  businessName?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    password:     { type: String, required: true },
    role:         { type: String, enum: ['user', 'owner'], default: 'user' },
    businessName: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
