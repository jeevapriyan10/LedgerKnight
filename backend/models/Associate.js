const { Schema, model } = require('mongoose');

const AssociateSchema = new Schema({
    _id: { type: String },
    institutionId: { type: String, required: true, index: true },
    password: { type: String, required: true },
    walletAddress: { type: String, default: null },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = model('Associate', AssociateSchema, 'associates');
