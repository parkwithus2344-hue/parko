import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IWallet extends Document {
  userId:    Types.ObjectId
  balance:   number
  createdAt: Date
  updatedAt: Date
}

const WalletSchema = new Schema<IWallet>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema)
