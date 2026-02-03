import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Suspended'],
    default: 'Pending',
  },
  certifications: [{
    type: String,
    trim: true,
  }],
  qualityIssues: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastAudit: {
    type: Date,
  },
  contactEmail: {
    type: String,
    trim: true,
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
