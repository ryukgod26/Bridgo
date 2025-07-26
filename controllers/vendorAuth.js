const express = require("express");
const router = express.Router();
const Vendor = require("../models/vendorDetails");

router.post("/vendor/login", async (req, res) => {
    const { vendorId, password } = req.body;

    try {
        // Find the vendor by vendorId
        const vendor = await Vendor.findOne({ vendorId });
        if (!vendor) {
            // Vendor not found
            return res.status(401).render("vendorLogin", { error: "Invalid Vendor ID or Password" });
        }

        // Check password (plain text, for demo; use hashing in production)
        if (vendor.password !== password) {
            return res.status(401).render("vendorLogin", { error: "Invalid Vendor ID or Password" });
        }
        req.session.vendor = {
            vendorId: vendor.vendorId,
            name: vendor.name || vendor.supplierId,
            phone: vendor.phone,
            email:vendor.email,
            contact: vendor.contact // or vendor.email if your schema uses 'email'
        };
        // Authentication successful, redirect to /vendor
        // You may want to set session/cookie here
        res.redirect("/vendor");
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
