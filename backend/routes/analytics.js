const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Institution = require('../models/Institution');

const router = express.Router();

// Get transaction analytics
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { institutionId } = req.user;
        const { startDate, endDate } = req.query;

        const inst = await Institution.findById(institutionId).lean();
        if (!inst) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        // Build query
        const query = { institutionOnchainId: String(inst.onchainId) };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query).lean();

        // Calculate analytics
        const total = transactions.length;
        const pending = transactions.filter(t => t.status === 0).length;
        const approved = transactions.filter(t => t.status === 1).length;
        const declined = transactions.filter(t => t.status === 2).length;
        const review = transactions.filter(t => t.status === 3).length;

        const totalAmount = transactions
            .filter(t => t.status === 1) // only approved
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const avgAmount = approved > 0 ? totalAmount / approved : 0;

        res.json({
            summary: {
                total,
                pending,
                approved,
                declined,
                review,
                totalAmount: totalAmount.toFixed(4),
                avgAmount: avgAmount.toFixed(4),
            },
            dateRange: {
                start: startDate || null,
                end: endDate || null,
            },
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics: ' + error.message });
    }
});

module.exports = router;
