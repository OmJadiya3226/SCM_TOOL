import express from 'express';
import Supplier from '../models/Supplier.js';
import RawMaterial from '../models/RawMaterial.js';
import Batch from '../models/Batch.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, qualityIssuesCount } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (qualityIssuesCount) {
      query.$expr = { $eq: [{ $size: "$qualityIssues" }, parseInt(qualityIssuesCount)] };
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/suppliers/:id
// @desc    Get single supplier
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/suppliers
// @desc    Create new supplier
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update supplier (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check if supplier is referenced in raw materials
    const rawMaterialsUsingSupplier = await RawMaterial.countDocuments({ supplier: req.params.id });

    // Check if supplier is referenced in batches
    const batchesUsingSupplier = await Batch.countDocuments({ source: req.params.id });

    if (rawMaterialsUsingSupplier > 0 || batchesUsingSupplier > 0) {
      const errors = [];
      if (rawMaterialsUsingSupplier > 0) {
        errors.push(`${rawMaterialsUsingSupplier} raw material(s)`);
      }
      if (batchesUsingSupplier > 0) {
        errors.push(`${batchesUsingSupplier} batch(es)`);
      }
      return res.status(400).json({
        message: `Cannot delete supplier. It is currently used in ${errors.join(' and ')}. Please remove or update these references first.`
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
