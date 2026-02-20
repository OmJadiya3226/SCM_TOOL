import express from 'express';
import Batch from '../models/Batch.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/batches
// @desc    Get all batches
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, source, buyer } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { batchNumber: { $regex: search, $options: 'i' } },
        { buyer: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (source) {
      query.source = source;
    }

    if (buyer) {
      query.buyer = buyer;
    }

    const batches = await Batch.find(query)
      .populate('rawMaterial', 'name purity')
      .populate('source', 'name status')
      .sort({ createdAt: -1 });

    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/batches/:id
// @desc    Get single batch
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('rawMaterial', 'name purity hazardClass storageTemp')
      .populate('source', 'name status certifications');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/batches
// @desc    Create new batch
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const batch = await Batch.create(req.body);
    const populatedBatch = await Batch.findById(batch._id)
      .populate('rawMaterial', 'name purity')
      .populate('source', 'name status');

    res.status(201).json(populatedBatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/batches/:id
// @desc    Update batch (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('rawMaterial', 'name purity')
      .populate('source', 'name status');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PATCH /api/batches/:id/review
// @desc    Update batch review (notes & approval status) (Admin & QA only)
// @access  Private/Admin/QA
router.patch('/:id/review', protect, async (req, res) => {
  try {
    // Check if user is admin or qa-worker
    if (req.user.role !== 'admin' && req.user.role !== 'qa-worker') {
      return res.status(403).json({ message: 'Not authorized to review batches' });
    }

    const { notes, approvalStatus } = req.body;
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;

    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/batches/:id
// @desc    Delete batch
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
