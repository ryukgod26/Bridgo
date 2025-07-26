const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    supplierId: {
        type: String,
        required: true,
        unique: true
    },
    name:{
        type:String,
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    gst: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
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
    }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
