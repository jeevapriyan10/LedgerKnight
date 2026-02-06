const { Schema, model } = require('mongoose');

const ConfigSchema = new Schema({
    _id: { type: String },
    institutionId: { type: String, required: true, unique: true },
    settings: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = model('Config', ConfigSchema, 'configs');
