import express from 'express';
import crypto from 'crypto';
import Supplier from '../models/Supplier.js';
import RawMaterial from '../models/RawMaterial.js';
import Batch from '../models/Batch.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

async function getActiveAlerts(user) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    const alerts = [];

    suppliers.forEach((supplier) => {
      if (Array.isArray(supplier.qualityIssues) && supplier.qualityIssues.length > 0) {
        supplier.qualityIssues.forEach(issue => {
          alerts.push({
            type: 'Quality Issue',
            message: `${supplier.name} - ${issue.description} (${new Date(issue.date).toLocaleDateString()})`,
            supplier: supplier.name,
            severity: 'high',
            date: new Date(issue.date)
          });
        });
      } else if (typeof supplier.qualityIssues === 'number' && supplier.qualityIssues > 0) {
        alerts.push({
          type: 'Quality Issues',
          message: `${supplier.name} - ${supplier.qualityIssues} quality issue(s)`,
          supplier: supplier.name,
          severity: 'high',
          date: new Date()
        });
      }

      if (supplier.certifications && supplier.certifications.length > 0) {
        supplier.certifications.forEach((cert) => {
          const expiryDate = typeof cert === 'object' && cert.expiryDate ? new Date(cert.expiryDate) : null;
          const certName = typeof cert === 'string' ? cert : cert.name;

          if (expiryDate && expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            alerts.push({
              type: 'Certification Expiring',
              message: `${supplier.name} - ${certName} expires in ${daysUntilExpiry} day(s)`,
              supplier: supplier.name,
              severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
              date: expiryDate
            });
          }
        });
      }
    });

    const [lowStockMaterials, rejectedBatches] = await Promise.all([
      RawMaterial.find({ status: 'Low Stock' }).populate('supplier', 'name'),
      Batch.find({ approvalStatus: 'Rejected' }).populate('rawMaterial', 'name').populate('source', 'name')
    ]);

    lowStockMaterials.forEach(material => {
      alerts.push({
        type: 'Low Stock',
        message: `${material.name} is low on stock (${material.quantity.value} ${material.quantity.unit} remaining)`,
        supplier: material.supplier ? material.supplier.name : 'Unknown',
        severity: 'high',
        date: new Date()
      });
    });

    rejectedBatches.forEach(batch => {
      alerts.push({
        type: 'Batch Rejected',
        message: `Batch ${batch.batchNumber} rejected${batch.notes ? `: ${batch.notes}` : ''}`,
        supplier: batch.source?.name || 'Unknown',
        severity: 'high',
        date: batch.updatedAt
      });
    });

    // Generate deterministic id and filter out dismissed alerts
    const activeAlerts = alerts.map(a => ({
      ...a,
      id: crypto.createHash('sha256').update(a.type + '|' + a.message).digest('hex')
    })).filter(a => !(user.dismissedAlerts || []).includes(a.id));

    return activeAlerts.sort((a, b) => {
      if (a.severity === 'high' && b.severity !== 'high') return -1;
      if (a.severity !== 'high' && b.severity === 'high') return 1;
      return 0;
    });
}

// @route   GET /api/dashboard/stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const activeAlerts = await getActiveAlerts(req.user);

    const [
      activeBatches,
      approvedSuppliersCount,
      totalRawMaterialsCount
    ] = await Promise.all([
      Batch.countDocuments({ status: 'Active' }),
      Supplier.countDocuments({ status: 'Approved' }),
      RawMaterial.countDocuments()
    ]);

    const stats = {
      totalRawMaterials: { value: totalRawMaterialsCount },
      activeSuppliers: { value: approvedSuppliersCount },
      activeBatches: { value: activeBatches },
      pendingAlerts: { value: activeAlerts.length },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/recent-batches
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
router.get('/supplier-alerts', protect, admin, async (req, res) => {
  try {
    const activeAlerts = await getActiveAlerts(req.user);
    res.json(activeAlerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/dashboard/alerts/:id/dismiss
router.post('/alerts/:id/dismiss', protect, admin, async (req, res) => {
  try {
    const user = req.user;
    if (!user.dismissedAlerts.includes(req.params.id)) {
      user.dismissedAlerts.push(req.params.id);
      await user.save();
    }
    res.json({ message: 'Alert dismissed successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/chart-data
router.get('/chart-data', protect, admin, async (req, res) => {
  try {
    const supplierStatuses = await Supplier.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const materialStatuses = await RawMaterial.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const batchApprovals = await Batch.aggregate([
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
    ]);

    const suppliers = await Supplier.find({});
    const supplierQualityIssues = suppliers
      .map(s => ({
        name: s.name,
        issueCount: Array.isArray(s.qualityIssues) ? s.qualityIssues.length : 0
      }))
      .filter(s => s.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 5);

    const stockLevels = await RawMaterial.find({})
      .sort({ 'quantity.value': -1 })
      .limit(5)
      .select('name quantity');

    res.json({
      supplierStatus: supplierStatuses,
      materialStatus: materialStatuses,
      batchApproval: batchApprovals,
      supplierQuality: supplierQualityIssues,
      stockLevels: stockLevels.map(m => ({
        name: m.name,
        quantity: m.quantity.value,
        unit: m.quantity.unit
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
