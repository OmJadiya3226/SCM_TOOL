import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    unique: true,
    trim: true,
  },
  rawMaterial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: [true, 'Raw material is required'],
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Source supplier is required'],
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
}, {
  timestamps: true,
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
