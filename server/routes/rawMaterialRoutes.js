import express from 'express';
import RawMaterial from '../models/RawMaterial.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/raw-materials
// @desc    Get all raw materials
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, supplier, hazardClass } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (hazardClass) {
      query.hazardClass = hazardClass;
    }

    const materials = await RawMaterial.find(query)
      .populate('supplier', 'name status')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/raw-materials/:id
// @desc    Get single raw material
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id)
      .populate('supplier', 'name status certifications');

    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/raw-materials
// @desc    Create new raw material
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const material = await RawMaterial.create(req.body);
    const populatedMaterial = await RawMaterial.findById(material._id)
      .populate('supplier', 'name status');

    res.status(201).json(populatedMaterial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/raw-materials/:id
// @desc    Update raw material (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name status');

    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/raw-materials/:id
// @desc    Delete raw material
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    res.json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
