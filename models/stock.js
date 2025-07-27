const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    image: {
        type: String // URL or path to the image
    },
    supplierName: {
        type: String,
        required: true
    },
    supplierId: {
        type: String,
        required: false // Temporarily make it optional to handle existing auctions
    },
    area: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    // Live auction fields
    isLive: {
        type: Boolean,
        default: false
    },
    auctionStart: {
        type: Date
    },
    auctionEnd: {
        type: Date
    },
    currentBid: {
        type: Number,
        default: 0
    },
    currentBidder: {
        type: String
    },
    bidders: [{
        vendorId: String,
        vendorName: String,
        vendorPhone: String,
        vendorEmail: String,
        vendorAddress: String,
        bidAmount: Number,
        bidTime: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'live', 'ended', 'sold'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
