require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectMongo } = require('./services/database');

const app = express();

// Trust proxy (for Vercel deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Body parsing
app.use(express.json());

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // max 100 requests per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Connect to MongoDB
connectMongo().catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
});

// Routes
// Routes - support both direct mounting and /api prefix for Vercel
const routes = [
    { path: '/auth', handler: require('./routes/auth') },
    { path: '/institutions', handler: require('./routes/institutions') },
    { path: '/transactions', handler: require('./routes/transactions') },
    { path: '/analytics', handler: require('./routes/analytics') },
    { path: '/config', handler: require('./routes/config') },
    { path: '/password', handler: require('./routes/password') },
];

routes.forEach(route => {
    app.use(route.path, route.handler);
    app.use('/api' + route.path, route.handler);
});

console.log('✅ Routes mounted: /auth, /institutions, /transactions, /analytics, /config, /password');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        eoaMode: true,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 4000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Ledger Knight Backend running on port ${PORT}`);
        console.log(`📡 Health check: http://localhost:${PORT}/health`);
        console.log(`🌐 CORS enabled for: ${corsOrigin}\n`);
    });
}

module.exports = app;
