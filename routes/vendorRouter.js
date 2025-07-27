const express = require("express");
const router = express.Router();

const Vendor = require("../models/vendorDetails");
const Stock = require("../models/stock");
const Requirement = require("../models/requirement");
const VendorAuction = require("../models/vendorAuction");

// Vendor login route
router.post("/login", async (req, res) => {
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
            name: vendor.name || vendor.vendorId,
            phone: vendor.phone,
            email: vendor.email,
            contact: vendor.contact,
            address: vendor.address,
            area: vendor.area,
            city: vendor.city,
            state: vendor.state
        };
        

        
        // Explicitly save session
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send("Error saving session");
            }

            res.redirect("/vendor");
        });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

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
router.get("/logout", (req, res) => {
    req.session.vendor = null;
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect("/"); // Render a logout confirmation EJS page
    });
});

router.get("/login", (req, res) => {
    res.render("vendorLogin");
});
router.get("/register", (req, res) => {
    res.render("vendorRegistration");
});
router.get("/", async (req, res) => {
    if (!req.session.vendor) {
        return res.redirect("/vendor/login");
    }
    res.render("vendor", {vendor: req.session.vendor });
});

// Route to view all live auctions
router.get("/live-auctions", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const liveAuctions = await Stock.find({ isLive: true });
        res.render("vendorLiveAuctions", { 
            auctions: liveAuctions, 
            vendor: req.session.vendor 
        });
    } catch (err) {
        console.error("Error in live auctions route:", err);
        res.status(500).send("Error fetching live auctions: " + err.message);
    }
});

// Route to join a specific live auction
router.get("/join-auction/:auctionId", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const { auctionId } = req.params;
        
        const auction = await Stock.findById(auctionId);
        
        if (!auction) {
            return res.status(404).send("Auction not found");
        }
        
        if (!auction.isLive) {
            return res.status(400).send("This auction is not live yet");
        }
        
        // Render the live auction page with vendor session data
        res.render("liveAuction", { auction, vendor: req.session.vendor, supplier: null, isSupplierOwner: false });
    } catch (err) {
        res.status(500).send("Error joining auction: " + err.message);
    }
});

// Vendor-specific live auction route
router.get("/live-auction/:auctionId", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const { auctionId } = req.params;
        const auction = await Stock.findById(auctionId);
        
        if (!auction) {
            return res.status(404).send("Auction not found");
        }
        
        if (!auction.isLive) {
            return res.status(400).send("This auction is not live yet");
        }
        
        // Render the live auction page with vendor session data
        res.render("liveAuction", { auction, vendor: req.session.vendor, supplier: null, isSupplierOwner: false });
    } catch (err) {
        res.status(500).send("Error fetching auction: " + err.message);
    }
});

// // Test route to check all auctions (for debugging)
// router.get("/test-auctions", async (req, res) => {
//     try {
//         const allAuctions = await Stock.find({});
//         res.json({
//             totalAuctions: allAuctions.length,
//             auctions: allAuctions.map(auction => ({
//                 id: auction._id,
//                 name: auction.name,
//                 isLive: auction.isLive,
//                 supplierName: auction.supplierName,
//                 supplierId: auction.supplierId
//             }))
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// Route for joining auctions (general auction page)
router.get("/auction/join", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        // Get all live auctions
        const liveAuctions = await Stock.find({ isLive: true });
        
        // Filter auctions based on vendor's requirements and city
        const vendorCity = req.session.vendor.city ? req.session.vendor.city.toLowerCase() : '';
        
        // Get vendor's requirements to find matching auctions
        const vendorRequirements = await Requirement.find({ 
            vendorId: req.session.vendor.vendorId 
        });
        
        const requirementItems = vendorRequirements.map(req => req.itemName.toLowerCase());
        
        // Function to check if cities are in same region/state
        function checkSameRegion(city1, city2) {
            // Punjab cities
            const punjabCities = ['jalandhar', 'amritsar', 'ludhiana', 'chandigarh', 'patiala', 'bathinda', 'moga', 'kapurthala', 'hoshiarpur', 'firozpur', 'sangrur', 'muktsar', 'faridkot', 'barnala', 'mansa', 'fazilka', 'pathankot', 'gurdaspur', 'tarn taran'];
            
            // Maharashtra cities
            const maharashtraCities = ['mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'aurangabad', 'solapur', 'kolhapur', 'amravati', 'nanded'];
            
            // Delhi NCR
            const delhiCities = ['delhi', 'gurgaon', 'noida', 'faridabad', 'ghaziabad', 'gurugram'];
            
            // Check if both cities are in same state/region
            if (punjabCities.includes(city1) && punjabCities.includes(city2)) {
                return true;
            }
            if (maharashtraCities.includes(city1) && maharashtraCities.includes(city2)) {
                return true;
            }
            if (delhiCities.includes(city1) && delhiCities.includes(city2)) {
                return true;
            }
            
            // For other cities, only exact match
            return city1 === city2;
        }
        
        // Filter auctions that match vendor's requirements and are from same city
        const relevantAuctions = liveAuctions.filter(auction => {
            const auctionName = auction.name.toLowerCase();
            const supplierCity = auction.supplierName ? auction.supplierName.toLowerCase() : '';
            
            // Check if auction item matches any of vendor's requirements
            const itemMatches = requirementItems.some(item => 
                auctionName.includes(item) || item.includes(auctionName)
            );
            
            // Strict city matching
            let cityMatches = false;
            if (!vendorCity || !supplierCity) {
                cityMatches = true; // Show all if either city is missing
            } else {
                // Exact match
                if (supplierCity === vendorCity) {
                    cityMatches = true;
                } else {
                    // Check if cities are in same state/region
                    cityMatches = checkSameRegion(supplierCity, vendorCity);
                }
            }
            
            return itemMatches && cityMatches;
        });
        
        res.render("vendorJoinAuction", { 
            auctions: relevantAuctions, 
            vendor: req.session.vendor,
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        res.status(500).send("Error fetching auctions: " + err.message);
    }
});

// POST route to handle requirement submission from vendorJoinAuction.ejs
router.post("/auction/join", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        const { itemName, requirement, quantity, other } = req.body;
        if (!itemName || !requirement || !quantity) {
            return res.redirect("/vendor/auction/join?error=missing_fields");
        }
        // Create new requirement for this vendor
        const newRequirement = new Requirement({
            vendorId: req.session.vendor.vendorId,
            itemName,
            requirement,
            quantity,
            other: other || '',
            vendorName: req.session.vendor.name,
            vendorCity: req.session.vendor.city,
            vendorArea: req.session.vendor.area,
            vendorPhone: req.session.vendor.phone,
            vendorEmail: req.session.vendor.email,
            vendorAddress: req.session.vendor.address
        });
        await newRequirement.save();
        return res.redirect("/vendor/auction/join?success=true");
    } catch (err) {
        return res.redirect("/vendor/auction/join?error=" + encodeURIComponent(err.message));
    }
});

// Route for creating auctions (placeholder)
router.get("/auction/create", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        res.render("vendorCreateAuction", { 
            vendor: req.session.vendor 
        });
    } catch (err) {
        res.status(500).send("Error loading create auction page: " + err.message);
    }
});

// Route to handle requirement submission
router.post("/submit-requirement", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const { itemName, requirement, quantity, other } = req.body;
        
        // Validate required fields
        if (!itemName || !requirement || !quantity) {
            return res.redirect("/vendor/auction/join?error=missing_fields");
        }
        
        const vendorAddress = [
            req.session.vendor.address,
            req.session.vendor.area,
            req.session.vendor.city,
            req.session.vendor.state
        ].filter(Boolean).join(', ');
        
        // Fallback if address is empty
        const finalAddress = vendorAddress || 'Address not provided';
        
        const newRequirement = new Requirement({
            vendorId: req.session.vendor.vendorId,
            vendorName: req.session.vendor.name,
            vendorPhone: req.session.vendor.phone,
            vendorEmail: req.session.vendor.email,
            vendorAddress: finalAddress,
            itemName: itemName.toLowerCase().trim(),
            requirement,
            quantity,
            other
        });
        
        await newRequirement.save();
        

        
        // Redirect back to browse auctions with success message
        res.redirect("/vendor/auction/join?success=true");
    } catch (err) {
        res.status(500).send("Error submitting requirement: " + err.message);
    }
});

// Route to view vendor's own requirements
router.get("/my-requirements", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const requirements = await Requirement.find({ 
            vendorId: req.session.vendor.vendorId 
        }).sort({ createdAt: -1 });
        
        res.render("vendorRequirements", { 
            requirements, 
            vendor: req.session.vendor 
        });
    } catch (err) {
        res.status(500).send("Error fetching requirements: " + err.message);
    }
});

// // Debug route to check vendor data
// router.get("/debug-vendor/:vendorId", async (req, res) => {
//     try {
//         const { vendorId } = req.params;
//         const vendor = await Vendor.findOne({ vendorId });
        
//         if (!vendor) {
//             return res.json({ error: "Vendor not found" });
//         }
        
//         res.json({
//             vendorId: vendor.vendorId,
//             name: vendor.name,
//             phone: vendor.phone,
//             email: vendor.email,
//             address: vendor.address,
//             area: vendor.area,
//             city: vendor.city,
//             state: vendor.state
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// ========== VENDOR AUCTION ROUTES ==========

// Route to create vendor auction page
router.get("/create-auction", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        res.render("vendorCreateAuction", { 
            vendor: req.session.vendor 
        });
    } catch (err) {
        res.status(500).send("Error loading create auction page: " + err.message);
    }
});

// Route to handle vendor auction creation
router.post("/create-auction", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const { 
            itemName, 
            quantity, 
            description, 
            basePrice, 
            auctionStart, 
            auctionEnd 
        } = req.body;
        
        // Validate required fields
        if (!itemName || !quantity || !basePrice || !auctionStart || !auctionEnd) {
            return res.redirect("/vendor/create-auction?error=missing_fields");
        }
        
        // Construct vendor address
        const vendorAddress = [
            req.session.vendor.address,
            req.session.vendor.area,
            req.session.vendor.city,
            req.session.vendor.state
        ].filter(Boolean).join(', ');
        
        const newAuction = new VendorAuction({
            vendorId: req.session.vendor.vendorId,
            vendorName: req.session.vendor.name,
            vendorPhone: req.session.vendor.phone,
            vendorEmail: req.session.vendor.email,
            vendorAddress: vendorAddress || 'Address not provided',
            vendorCity: req.session.vendor.city,
            vendorArea: req.session.vendor.area,
            itemName: itemName.trim(),
            quantity: parseInt(quantity),
            description: description || '',
            basePrice: parseFloat(basePrice),
            auctionStart: new Date(auctionStart),
            auctionEnd: new Date(auctionEnd)
        });
        
        await newAuction.save();
        
        res.redirect("/vendor/my-auctions?success=true");
    } catch (err) {
        res.status(500).send("Error creating auction: " + err.message);
    }
});

// Function to update auction status based on time
async function updateAuctionStatus() {
    try {
        const now = new Date();
        
        // Update live auctions that have ended
        await VendorAuction.updateMany(
            {
                status: 'live',
                isLive: true,
                auctionEnd: { $lte: now }
            },
            {
                $set: {
                    status: 'ended',
                    isLive: false
                }
            }
        );
        
        // Update pending auctions that should be live
        await VendorAuction.updateMany(
            {
                status: 'pending',
                auctionStart: { $lte: now },
                auctionEnd: { $gt: now }
            },
            {
                $set: {
                    status: 'live',
                    isLive: true
                }
            }
        );
    } catch (err) {
        console.error('Error updating auction status:', err);
    }
}

// Route to view vendor's own auctions
router.get("/my-auctions", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        // Update auction status before fetching
        await updateAuctionStatus();
        
        const auctions = await VendorAuction.find({ 
            vendorId: req.session.vendor.vendorId 
        }).sort({ createdAt: -1 });
        
        res.render("vendorMyAuctions", { 
            auctions, 
            vendor: req.session.vendor 
        });
    } catch (err) {
        res.status(500).send("Error fetching auctions: " + err.message);
    }
});

// Route to start a vendor auction
router.post("/start-vendor-auction", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.status(401).json({ success: false, error: "Not authenticated" });
        }
        
        const { auctionId } = req.body;
        
        const auction = await VendorAuction.findOne({ 
            _id: auctionId, 
            vendorId: req.session.vendor.vendorId 
        });
        
        if (!auction) {
            return res.status(404).json({ success: false, error: "Auction not found" });
        }
        
        // Update auction to live status
        auction.isLive = true;
        auction.status = 'live';
        auction.auctionStart = new Date();
        await auction.save();
        
        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('vendorAuctionStarted', {
                auctionId: auction._id,
                itemName: auction.itemName,
                vendorName: auction.vendorName,
                basePrice: auction.basePrice
            });
        }
        
        res.json({ success: true, message: "Auction started successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Route to view live vendor auction
router.get("/live-vendor-auction/:auctionId", async (req, res) => {
    try {
        if (!req.session.vendor) {
            return res.redirect("/vendor/login");
        }
        
        const { auctionId } = req.params;
        
        // Update auction status before fetching
        await updateAuctionStatus();
        
        const auction = await VendorAuction.findById(auctionId);
        
        if (!auction) {
            return res.status(404).send("Auction not found");
        }
        
        res.render("vendorLiveAuction", { 
            auction, 
            vendor: req.session.vendor 
        });
    } catch (err) {
        res.status(500).send("Error loading auction: " + err.message);
    }
});

// Manual endpoint to update auction status (for testing)
router.get("/update-auction-status", async (req, res) => {
    try {
        await updateAuctionStatus();
        res.json({ success: true, message: "Auction status updated" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
