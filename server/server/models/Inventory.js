import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'Leaf Spring Parts',
    trim: true,
  },
  partNumber: {
    type: String,
    default: '',
    trim: true,
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  stockQuantity: {
    type: Number,
    default: 0,
  },
  minStockAlert: {
    type: Number,
    default: 5,
  },
  unit: {
    type: String,
    default: 'Pcs',
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);
