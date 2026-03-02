import express from 'express';
import SystemSetting from '../models/SystemSetting.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/settings/registration-secrets
// @desc    Get all registration secret passwords
// @access  Private/Admin
router.get('/registration-secrets', protect, admin, async (req, res) => {
    try {
        const keys = ['USER_SECRET_PASSWORD', 'ADMIN_SECRET_PASSWORD', 'QA_SECRET_PASSWORD'];
        const settings = await SystemSetting.find({ key: { $in: keys } });

        // Map to a more convenient format for the frontend
        const secrets = {};
        keys.forEach(key => {
            const setting = settings.find(s => s.key === key);
            secrets[key] = setting ? setting.value : process.env[key] || '';
        });

        res.json(secrets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/settings/registration-secrets
// @desc    Update registration secret passwords
// @access  Private/Admin
router.put('/registration-secrets', protect, admin, async (req, res) => {
    try {
        const { USER_SECRET_PASSWORD, ADMIN_SECRET_PASSWORD, QA_SECRET_PASSWORD } = req.body;
        const updates = { USER_SECRET_PASSWORD, ADMIN_SECRET_PASSWORD, QA_SECRET_PASSWORD };

        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                await SystemSetting.findOneAndUpdate(
                    { key },
                    { key, value },
                    { upsert: true, new: true, runValidators: true }
                );
            }
        }

        res.json({ message: 'Registration secrets updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
