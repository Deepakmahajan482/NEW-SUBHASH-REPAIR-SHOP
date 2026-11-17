import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerAddress: { type: String },
  items: [itemSchema],
  subTotal: { type: Number },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  totalQuantity: { type: Number },
  paymentStatus: { type: String, default: 'Pending' },
  paymentMethod: { type: String, default: 'Cash' },
  notes: { type: String },
}, { timestamps: true });

// Auto-calculate totals
invoiceSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    const calculatedSubTotal = this.items.reduce((acc, item) => acc + (item.total || (item.price * item.quantity)), 0);
    this.subTotal = calculatedSubTotal;
    const disc = Number(this.discount) || 0;
    this.totalAmount = Math.max(0, calculatedSubTotal - disc);
    this.totalQuantity = this.items.reduce((acc, item) => acc + item.quantity, 0);
    const paid = Number(this.paidAmount) || 0;
    this.balanceDue = Math.max(0, this.totalAmount - paid);
    if (this.balanceDue <= 0 && this.totalAmount > 0) {
      this.paymentStatus = 'Paid';
    } else if (paid > 0) {
      this.paymentStatus = 'Partial';
    }
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
