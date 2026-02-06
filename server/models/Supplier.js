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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
  }],
  qualityIssues: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
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
