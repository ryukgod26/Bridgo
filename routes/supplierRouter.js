const express = require("express");
const router = express.Router();

const Supplier = require("../models/supplierDetails");

router.post("/register", async (req, res) => {
    try {
        const { supplierId, name,password, email, phone, gst, address, area, city, state } = req.body;
        const newSupplier = new Supplier({
            supplierId,
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
        await newSupplier.save();
        res.redirect("/supplier/login");
    } catch (err) {
        res.status(500).send("Error registering supplier: " + err.message);
    }
});


router.get("/login", (req, res) => {
    res.render("supplierLogin");
});
router.get("/register", (req, res) => {
    res.render("supplierRegistration");
});
router.get("/", (req, res) => {
    if (!req.session.supplier) {
        console.log("error aa gya ")
    }
    res.render("supplier", { supplier: req.session.supplier });
});

module.exports = router;
