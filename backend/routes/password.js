const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const Auditor = require('../models/Auditor');
const Associate = require('../models/Associate');

const router = express.Router();

// Change password for auditor
router.post('/change-password/auditor', authenticateToken, requireRole('auditor'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Find auditor - use institutionId not institutionOnchainId
        const auditor = await Auditor.findOne({ institutionId: req.user.institutionId });

        if (!auditor) {
            console.error('Auditor not found for institutionId:', req.user.institutionId);
            return res.status(404).json({ error: 'Auditor not found' });
        }

        // Verify current password (plain text comparison for now)
        if (auditor.password !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        auditor.password = newPassword;
        await auditor.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Change password for associate
router.post('/change-password/associate', authenticateToken, requireRole('associate'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Find associate
        const associate = await Associate.findById(req.user.id);

        if (!associate) {
            return res.status(404).json({ error: 'Associate not found' });
        }

        // Verify current password
        if (associate.password !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        associate.password = newPassword;
        await associate.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;
