const express = require("express");
const router = express.Router();

const Vendor = require("../models/vendorDetails");

router.post("/register", async (req, res) => {
    try {
        const { vendorId,name, password, email, phone, gst, address, area, city, state } = req.body;

        // Create a new Vendor instance
        const newVendor = new Vendor({
            vendorId,
            name,
            password,
            email,
            phone,
            gst,
            address,
            area,
            city,
            state
        });

        // Save the vendor to the database
        await newVendor.save();

        // Redirect to login page after successful registration
        res.redirect("/vendor/login");
    } catch (error) {
        // Handle duplicate vendorId or other errors
        res.status(400).send("Error registering vendor: " + error.message);
    }
});


router.get("/login", (req, res) => {
    res.render("vendorLogin");
});
router.get("/register", (req, res) => {
    res.render("vendorRegistration");
router.get("/", async (req, res) => {
    if (!req.session.vendor) {
        console.log("error aa gya ")
    }
    res.render("vendor", {vendor: req.session.vendor });
});
})

module.exports = router;
