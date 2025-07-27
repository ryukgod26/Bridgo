const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
    vendorId: {
        type: String,
        required: true
    },
    vendorName: {
        type: String,
        required: true
    },
    vendorPhone: {
        type: String,
        required: true
    },
    vendorEmail: {
        type: String,
        required: true
    },
    vendorAddress: {
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    requirement: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    other: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    supplierResponses: [{
        supplierId: String,
        supplierName: String,
        supplierPhone: String,
        supplierEmail: String,
        message: String,
        proposedPrice: Number,
        proposedQuantity: Number,
        responseTime: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Requirement = mongoose.model('Requirement', requirementSchema);

module.exports = Requirement; 