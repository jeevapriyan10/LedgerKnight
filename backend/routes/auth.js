const express = require('express');
const jwt = require('jsonwebtoken');
const { Wallet } = require('ethers');
const Institution = require('../models/Institution');
const Auditor = require('../models/Auditor');
const Associate = require('../models/Associate');
const { encrypt } = require('../services/crypto');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

// Register new institution
router.post('/register', async (req, res) => {
    try {
        const { name, location, auditorPassword } = req.body || {};

        if (!name || !location || !auditorPassword) {
            return res.status(400).json({ error: 'Missing required fields: name, location, auditorPassword' });
        }

        // Generate unique institution ID
        let institutionId;
        do {
            institutionId = 'INS' + Math.floor(1000 + Math.random() * 9000);
        } while (await Institution.findById(institutionId).lean());

        const onchainId = String(Date.now());

        // Create Ethereum wallet
        const wallet = Wallet.createRandom();
        const walletAddress = wallet.address;
        const walletKeyEnc = encrypt(wallet.privateKey);

        // Create institution
        await Institution.create({
            _id: institutionId,
            name,
            location,
            onchainId,
            walletAddress,
            walletKeyEnc,
            createdAt: new Date(),
        });

        // Create default auditor
        const auditorId = 'AUD' + Math.floor(1000 + Math.random() * 9000);
        await Auditor.create({
            _id: auditorId,
            institutionId,
            password: auditorPassword,
            createdAt: new Date(),
        });

        res.json({ institutionId, walletAddress });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
});

// Auditor login
router.post('/login-auditor', async (req, res) => {
    try {
        const { institutionId, password } = req.body || {};

        if (!institutionId || !password) {
            return res.status(400).json({ error: 'Missing institutionId or password' });
        }

        const inst = await Institution.findById(institutionId).lean();
        if (!inst) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        const auditor = await Auditor.findOne({ institutionId }).lean();
        if (!auditor || auditor.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken({
            userId: auditor._id,
            institutionId,
            role: 'auditor',
            address: inst.walletAddress || null,
        });

        res.json({
            token,
            user: {
                id: auditor._id,
                institutionId,
                role: 'auditor',
                address: inst.walletAddress || null,
            },
        });
    } catch (error) {
        console.error('Auditor login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
});

// Associate login
router.post('/login-associate', async (req, res) => {
    try {
        const { institutionId, empId, password } = req.body || {};

        if (!institutionId || !empId || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inst = await Institution.findById(institutionId).lean();
        if (!inst) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        const assoc = await Associate.findById(empId).lean();
        if (!assoc || assoc.institutionId !== institutionId || assoc.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken({
            userId: assoc._id,
            institutionId,
            role: 'associate',
            address: inst.walletAddress || null,
        });

        res.json({
            token,
            user: {
                id: assoc._id,
                institutionId,
                role: 'associate',
                address: inst.walletAddress || null,
            },
        });
    } catch (error) {
        console.error('Associate login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
});

// Create associate (auditor only)
router.post('/create-associate', async (req, res) => {
    try {
        const { institutionId, associatePassword, auditorPassword } = req.body || {};

        if (!institutionId || !associatePassword || !auditorPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inst = await Institution.findById(institutionId).lean();
        if (!inst) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        const auditor = await Auditor.findOne({ institutionId }).lean();
        if (!auditor || auditor.password !== auditorPassword) {
            return res.status(401).json({ error: 'Invalid auditor password' });
        }

        // Check maximum associates limit
        const existingCount = await Associate.countDocuments({ institutionId });
        if (existingCount >= 4) {
            return res.status(400).json({ error: 'Maximum 4 associates allowed per institution' });
        }

        // Generate unique employee ID
        let empId;
        do {
            empId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
        } while (await Associate.findById(empId).lean());

        await Associate.create({
            _id: empId,
            institutionId,
            password: associatePassword,
            walletAddress: inst.walletAddress || null,
            createdBy: auditor._id,
            createdAt: new Date(),
        });

        res.json({ empId });
    } catch (error) {
        console.error('Create associate error:', error);
        res.status(500).json({ error: 'Failed to create associate: ' + error.message });
    }
});

// Delete associate (auditor only)
router.delete('/delete-associate', async (req, res) => {
    try {
        const { institutionId, empId, auditorPassword } = req.body || {};

        if (!institutionId || !empId || !auditorPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const auditor = await Auditor.findOne({ institutionId }).lean();
        if (!auditor || auditor.password !== auditorPassword) {
            return res.status(401).json({ error: 'Invalid auditor password' });
        }

        const assoc = await Associate.findById(empId).lean();
        if (!assoc || assoc.institutionId !== institutionId) {
            return res.status(404).json({ error: 'Associate not found' });
        }

        await Associate.deleteOne({ _id: empId });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete associate error:', error);
        res.status(500).json({ error: 'Failed to delete associate: ' + error.message });
    }
});

// List associates (auditor only, authenticated)
router.get('/associates/:institutionId', async (req, res) => {
    try {
        const { institutionId } = req.params;

        const associates = await Associate.find({ institutionId })
            .select('_id createdAt createdBy')
            .lean();

        res.json({ associates });
    } catch (error) {
        console.error('List associates error:', error);
        res.status(500).json({ error: 'Failed to list associates: ' + error.message });
    }
});

module.exports = router;
