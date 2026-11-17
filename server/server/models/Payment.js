import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invoice', 
    required: true 
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);