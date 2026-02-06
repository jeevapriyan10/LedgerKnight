const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Institution = require('../models/Institution');
const eoaService = require('../services/eoa');

const router = express.Router();

// Get institution details
router.get('/:institutionId', authenticateToken, async (req, res) => {
    try {
        const { institutionId } = req.params;

        const inst = await Institution.findById(institutionId)
            .select('_id name location walletAddress createdAt')
            .lean();

        if (!inst) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        res.json({ institution: inst });
    } catch (error) {
        console.error('Get institution error:', error);
        res.status(500).json({ error: 'Failed to fetch institution: ' + error.message });
    }
});

// Get institution wallet balance
router.get('/:institutionId/balance', authenticateToken, async (req, res) => {
    try {
        const { institutionId } = req.params;

        const balance = await eoaService.getInstitutionBalance(institutionId);
        res.json({ balance });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to fetch balance: ' + error.message });
    }
});

module.exports = router;
