const { z } = require('zod');

const transactionSchema = z.object({
    receiver: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    amountEther: z.string().refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        'Amount must be a positive number'
    ),
    purpose: z.string().min(1, 'Purpose is required'),
    comment: z.string().optional(),
    deadline: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
});

function validateTransactionCreation(req, res, next) {
    try {
        transactionSchema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
            });
        }
        next(error);
    }
}

module.exports = {
    validateTransactionCreation,
};
