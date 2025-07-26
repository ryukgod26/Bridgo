const express = require("express");
const router = express.Router();
const Stock = require("../models/stock");
const Supplier = require("../models/supplierDetails");
const { uploadSupplier} = require("../config/cloudinaryupload");

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
router.post("/auction/auctions", uploadSupplier.single("image"), async (req, res) => {
    try {

        const {
            name,
            basePrice,
            quantity,
            area,
            city,
            state
        } = req.body;

        // Get supplier name and id from session if available
        let supplierName = "";
        let supplierId = "";
        if (req.session && req.session.supplier) {
            supplierName = req.session.supplier.name || "";
            supplierId = req.session.supplier.supplierId || "";
        }
        // Fallbacks if not in session
        if (!supplierName && req.body.supplierName) {
            supplierName = req.body.supplierName;
        }
        if (!supplierId && req.body.supplierId) {
            supplierId = req.body.supplierId;
        }
        if (!supplierName) {
            supplierName = supplierId || "Unknown Supplier";
        }

        const newStock = new Stock({
            name,
            basePrice,
            quantity,
            image: req.file ? req.file.path : "",
            supplierName,
            supplierId, // Store supplierId as well
            area: area || "Not specified",
            city,
            state
        });

        await newStock.save();
        res.redirect("/supplier/auction/auctionsView");
    } catch (err) {
        res.status(500).send("Error creating auction: " + err.message);
    }
});
router.get("/auction/auctionsView", async (req, res) => {
    try {
        if (!req.session.supplier) {
            return res.redirect("/supplier");
        }
        const supplierId = req.session.supplier.supplierId;
        // Find all auctions (stocks) listed by this supplier
        const auctions = await Stock.find({ supplierName: req.session.supplier.name });
        res.render("auctions", { auctions, supplier: req.session.supplier });
    } catch (err) {
        res.status(500).send("Error fetching auctions: " + err.message);
    }
});

router.get("/auction/stock", (req, res) => {
    if (!req.session.supplier) {
        return res.redirect("/supplier/login");
    }
    res.render("stock", { supplier: req.session.supplier });
});

router.get("/logout", (req, res) => {
    req.session.supplier = null;
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect("/"); // Render the supplier login page after logout
    });
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
