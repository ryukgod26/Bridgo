const mongoose = require('mongoose');

const vendorAuctionSchema = new mongoose.Schema({
    vendorId: { type: String, required: true },
    vendorName: { type: String, required: true },
    vendorPhone: { type: String, required: true },
    vendorEmail: { type: String, required: true },
    vendorAddress: { type: String, required: true },
    vendorCity: { type: String, required: true },
    vendorArea: { type: String, required: true },
    
    // Auction details
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    description: { type: String },
    basePrice: { type: Number, required: true }, // Maximum price vendor is willing to pay
    
    // Auction timing
    auctionStart: { type: Date, required: true },
    auctionEnd: { type: Date, required: true },
    isLive: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'live', 'ended', 'cancelled'], default: 'pending' },
    
    // Bidding details
    currentLowestBid: { type: Number },
    currentLowestBidder: { type: String },
    bidders: [{
        supplierId: String,
        supplierName: String,
        supplierPhone: String,
        supplierEmail: String,
        supplierAddress: String,
        supplierCity: String,
        bidAmount: Number,
        bidTime: { type: Date, default: Date.now }
    }],
    
    // Winner details
    winner: {
        supplierId: String,
        supplierName: String,
        supplierPhone: String,
        supplierEmail: String,
        supplierAddress: String,
        winningBid: Number,
        winTime: Date
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const VendorAuction = mongoose.model('VendorAuction', vendorAuctionSchema);

module.exports = VendorAuction; 