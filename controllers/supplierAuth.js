const express = require("express");
const router = express.Router();
const Supplier = require("../models/supplierDetails");


// Supplier login route
router.post("/supplier/login", async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const supplier = await Supplier.findOne({ supplierId:loginId, password:password });
        if (!supplier) {
            // Invalid credentials
            return res.status(401).render("supplierLogin", { error: "Invalid Supplier ID or password" });
        }
        // Set session or cookie if needed
        req.session.supplier = {
            supplierId: supplier.supplierId,
            name: supplier.name || supplier.supplierId,
            email:supplier.email,
            phone: supplier.phone,
            contact: supplier.contact // or supplier.email if your schema uses 'email'
        };
        res.redirect("/supplier");
    } catch (err) {
        res.status(500).send("Error logging in: " + err.message);
    }
});

module.exports = router;
