const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Config = require('../models/Config');

const router = express.Router();

// Get config for institution
router.get('/:institutionId', authenticateToken, async (req, res) => {
    try {
        const { institutionId } = req.params;

        let config = await Config.findOne({ institutionId }).lean();

        if (!config) {
            // Create default config
            config = await Config.create({
                _id: 'CFG' + Date.now(),
                institutionId,
                settings: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        res.json({ config });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ error: 'Failed to fetch config: ' + error.message });
    }
});

// Update config
router.put('/:institutionId', authenticateToken, async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { settings } = req.body;

        const config = await Config.findOneAndUpdate(
            { institutionId },
            { settings, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        res.json({ config });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: 'Failed to update config: ' + error.message });
    }
});

module.exports = router;
