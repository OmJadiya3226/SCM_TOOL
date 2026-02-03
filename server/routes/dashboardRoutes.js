import express from 'express';
import Supplier from '../models/Supplier.js';
import RawMaterial from '../models/RawMaterial.js';
import Batch from '../models/Batch.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (Admin only)
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [
      totalRawMaterials,
      activeSuppliers,
      activeBatches,
      lowStockMaterials,
    ] = await Promise.all([
      RawMaterial.countDocuments(),
      Supplier.countDocuments({ status: 'Approved' }),
      Batch.countDocuments({ status: 'Active' }),
      RawMaterial.countDocuments({ status: 'Low Stock' }),
    ]);

    // Calculate percentage changes (mock data for now, can be enhanced with historical data)
    const stats = {
      totalRawMaterials: {
        value: totalRawMaterials,
        change: '+12%', // This can be calculated from historical data
      },
      activeSuppliers: {
        value: activeSuppliers,
        change: '+5%',
      },
      activeBatches: {
        value: activeBatches,
        change: '+8%',
      },
      pendingAlerts: {
        value: lowStockMaterials,
        change: '-3%',
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/recent-batches
// @desc    Get recent batches (Admin only)
// @access  Private/Admin
router.get('/recent-batches', protect, admin, async (req, res) => {
  try {
    const batches = await Batch.find({ status: 'Active' })
      .populate('rawMaterial', 'name')
      .populate('source', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/supplier-alerts
// @desc    Get supplier alerts (certifications expiring, quality issues) (Admin only)
// @access  Private/Admin
router.get('/supplier-alerts', protect, admin, async (req, res) => {
  try {
    // Get suppliers with quality issues or pending status
    const suppliers = await Supplier.find({
      $or: [
        { qualityIssues: { $gt: 0 } },
        { status: 'Pending' },
      ],
    })
      .sort({ qualityIssues: -1, createdAt: -1 })
      .limit(5);

    // Format alerts
    const alerts = suppliers.map((supplier) => ({
      type: supplier.qualityIssues > 0 ? 'Quality Issues' : 'Certification Expiring Soon',
      message: supplier.qualityIssues > 0
        ? `${supplier.name} - ${supplier.qualityIssues} quality issue(s)`
        : `${supplier.name} - Certification expiring soon`,
      supplier: supplier.name,
      severity: supplier.qualityIssues > 0 ? 'high' : 'medium',
    }));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
