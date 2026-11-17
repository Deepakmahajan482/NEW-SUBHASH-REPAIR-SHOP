import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  headerBanner: {
    type: String,
    default: 'ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ',
  },
  shopName: {
    type: String,
    default: 'New Subash Repair Shop',
  },
  shopNo: {
    type: String,
    default: 'Shop No: 403, Jai Inder Singh Market, Jahajgarh, Amritsar',
  },
  mobile: {
    type: String,
    default: '9846103347',
  },
  specifications: {
    type: String,
    default: 'Tata Leyland, A.M.W., Leaf Spring Repair',
  },
  propertyOwner: {
    type: String,
    default: 'Pawan Kumar (Kala)',
  },
  ownerPhotoUrl: {
    type: String,
    default: '/owner.png',
  },
  qrCodeUrl: {
    type: String,
    default: '/qr-code.png',
  },
  upiId: {
    type: String,
    default: '9846103347@upi',
  },
  whatsappAccessToken: {
    type: String,
    default: '',
  },
  whatsappPhoneId: {
    type: String,
    default: '',
  },
  whatsappAutoSend: {
    type: Boolean,
    default: false,
  },
  whatsappMessageTemplate: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
