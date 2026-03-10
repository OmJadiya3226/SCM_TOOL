import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    unique: true,
    trim: true,
  },
  rawMaterial: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
    }],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one raw material is required'
    }
  },
  source: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    }],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one source supplier is required'
    }
  },
  productionDate: {
    type: Date,
    required: [true, 'Production date is required'],
  },
  acquisitionDate: {
    type: Date,
    required: [true, 'Acquisition date is required'],
  },
  buyer: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true,
  },
  contents: {
    type: String,
    required: [true, 'Contents description is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active',
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
  notes: {
    type: String,
    trim: true,
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
