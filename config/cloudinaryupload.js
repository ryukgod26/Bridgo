// config/cloudinaryUpload.js

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});
// Multer + Cloudinary storage setup
const storageVendor = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "VendorImages", // Optional folder name in Cloudinary
        allowed_formats: ["jpg", "png", "jpeg"]
    }
});
const storageSupplier = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "SupplierImages", // Optional folder name in Cloudinary
        allowed_formats: ["jpg", "png", "jpeg"]
    }
});

const uploadVendor = multer({ storage: storageVendor });
const uploadSupplier = multer({ storage: storageSupplier });

module.exports = {
    uploadVendor,
    uploadSupplier,
};
