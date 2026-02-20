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
    const totalRawMaterials = await RawMaterial.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ status: 'Approved' }); // Changed locally to match logical 'active' state if needed, or keep 'Pending' if that was intended. User requested "Active Suppliers" count in stats but code was counting 'Pending'. Let's stick to what it was or check? The UI says "Active Suppliers". I should probably fix this to count Approved ones or all? The original code counted 'Pending'. I'll stick to 'Pending' if that's what 'activeSuppliers' variable meant, BUT the variable name is activeSuppliers. Let's look at the original code: `Supplier.countDocuments({ status: 'Pending' })`. That seems wrong for "Active". I will count 'Approved'. Wait, let me check the file content again.
    // The original code was: `activeSuppliers: Supplier.countDocuments({ status: 'Pending' })`. 
    // The UI says "Active Suppliers". 
    // I will calculating "Supplier Alerts" count instead of just "Pending" count for the alerts box.
    // For "Active Suppliers", I will count actual active suppliers. 
    // But my main task is the ALERTS.

    // Let's first calculate the ALERTS count.

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suppliers = await Supplier.find({});

    let totalQualityIssues = 0;
    let expiringCertsCount = 0;
    let pendingSuppliersCount = 0;
    let approvedSuppliersCount = 0;

    suppliers.forEach(supplier => {
      // Count Quality Issues
      if (Array.isArray(supplier.qualityIssues)) {
        totalQualityIssues += supplier.qualityIssues.length;
      } else if (typeof supplier.qualityIssues === 'number') {
        // Fallback for old data if any
        totalQualityIssues += supplier.qualityIssues;
      }

      // Count Expiring Certs
      if (supplier.certifications && supplier.certifications.length > 0) {
        supplier.certifications.forEach(cert => {
          const expiryDate = typeof cert === 'object' && cert.expiryDate ? new Date(cert.expiryDate) : null;
          if (expiryDate && expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
            expiringCertsCount++;
          }
        });
      }

      if (supplier.status === 'Pending') pendingSuppliersCount++;
      if (supplier.status === 'Approved') approvedSuppliersCount++;
    });

    const totalSupplierAlerts = totalQualityIssues + expiringCertsCount;

    const [
      activeBatches,
      lowStockMaterialsCount,
      rejectedBatchesCount,
    ] = await Promise.all([
      Batch.countDocuments({ status: 'Active' }),
      RawMaterial.countDocuments({ status: 'Low Stock' }),
      Batch.countDocuments({ approvalStatus: 'Rejected' }),
    ]);

    const totalImportantAlerts = totalQualityIssues + expiringCertsCount + lowStockMaterialsCount + rejectedBatchesCount;

    const stats = {
      totalRawMaterials: {
        value: await RawMaterial.countDocuments(),
      },
      activeSuppliers: {
        value: approvedSuppliersCount,
      },
      activeBatches: {
        value: activeBatches,
      },
      pendingAlerts: {
        value: totalImportantAlerts,
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
    // Calculate date 30 days from now for expiring certifications
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all suppliers
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });

    const alerts = [];

    suppliers.forEach((supplier) => {
      // Check Quality Issues
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
        // Legacy support
        alerts.push({
          type: 'Quality Issues',
          message: `${supplier.name} - ${supplier.qualityIssues} quality issue(s)`,
          supplier: supplier.name,
          severity: 'high',
          date: new Date()
        });
      }

      // Check Expiring Certifications
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
              date: expiryDate // Use expiry date for sorting? Or maybe we want most urgent first.
            });
          }
        });
      }
    });

    // Sort by severity (high first) then by relevant date
    const sortedAlerts = alerts
      .sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (a.severity !== 'high' && b.severity === 'high') return 1;
        return 0; // Could add secondary sort by date
      });
    // Removed .slice(0, 5) to show all alerts as implied by "list all issues" request, or should I keep a limit? 
    // User said "list all issues that each supplier has". I will remove the limit or increase it significantly. 
    // I'll keep it unbounded for now as requested "list all".

    const [
      lowStockMaterials,
      rejectedBatchesCount, // Destructured rejectedBatchesCount
    ] = await Promise.all([
      RawMaterial.find({ status: 'Low Stock' }).populate('supplier', 'name'),
      Batch.countDocuments({ approvalStatus: 'Rejected' }),
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

    // Get rejected batches
    const rejectedBatches = await Batch.find({ approvalStatus: 'Rejected' })
      .populate('rawMaterial', 'name')
      .populate('source', 'name');

    rejectedBatches.forEach(batch => {
      alerts.push({
        type: 'Batch Rejected',
        message: `Batch ${batch.batchNumber} rejected${batch.notes ? `: ${batch.notes}` : ''}`,
        supplier: batch.source?.name || 'Unknown', // Or maybe we don't need supplier for this alert type?
        severity: 'high',
        date: batch.updatedAt
      });
    });

    res.json(sortedAlerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
