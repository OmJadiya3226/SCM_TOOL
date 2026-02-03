import mongoose from 'mongoose';

const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
  },
  purity: {
    type: String,
    required: [true, 'Purity is required'],
    trim: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required'],
  },
  hazardClass: {
    type: String,
    required: [true, 'Hazard class is required'],
    trim: true,
  },
  storageTemp: {
    type: String,
    required: [true, 'Storage temperature is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock',
  },
  quantity: {
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'L', 'g', 'mL'],
    },
  },
  expiryDate: {
    type: Date,
  },
  lotNumber: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);

export default RawMaterial;
