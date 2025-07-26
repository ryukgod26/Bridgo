const express = require("express");
const router = express.Router();
const Supplier = require("../models/supplierDetails");

// Supplier login route
router.post("/supplier/login", async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const supplier = await Supplier.findOne({ supplierId:loginId, password:password });
        console.log(supplier);
        if (!supplier) {
            // Invalid credentials
            return res.status(401).render("supplierLogin", { error: "Invalid Supplier ID or password" });
        }
        // Set session or cookie if needed
        req.session.supplier = {
            loginId: supplier.loginId,
            name: supplier.name || supplier.loginId,
            phone: supplier.phone,
            contact: supplier.email
        };
        res.redirect("/supplier");
    } catch (err) {
        res.status(500).send("Error logging in: " + err.message);
    }
});

// Supplier dashboard route (protected)
router.get("/dashboard", (req, res) => {
    if (!req.session.supplier) {
        return res.redirect("/supplier/login");
    }
    res.render("supplier", { supplier: req.session.supplier });
});

module.exports = router;
