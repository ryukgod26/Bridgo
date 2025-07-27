const express = require("express");
const router = express.Router();
const Stock = require("../models/stock");
const Supplier = require("../models/supplierDetails");
const Requirement = require("../models/requirement");
const VendorAuction = require("../models/vendorAuction");
const { uploadSupplier} = require("../config/cloudinaryupload");

// Supplier login route
router.post("/login", async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const supplier = await Supplier.findOne({ supplierId: loginId, password: password });
        if (!supplier) {
            // Invalid credentials
            return res.status(401).render("supplierLogin", { error: "Invalid Supplier ID or password" });
        }
        // Set session
        req.session.supplier = {
            supplierId: supplier.supplierId,
            name: supplier.name || supplier.supplierId,
            email: supplier.email,
            phone: supplier.phone,
            contact: supplier.contact
        };
        
        // Explicitly save session
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send("Error saving session");
            }

            res.redirect("/supplier");
        });
    } catch (err) {
        res.status(500).send("Error logging in: " + err.message);
    }
});

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
        
        // If supplierId is still not available, try to get it from the database
        if (!supplierId && supplierName) {
            try {
                const supplier = await Supplier.findOne({ name: supplierName });
                if (supplier) {
                    supplierId = supplier.supplierId;
                }
            } catch (err) {
                console.error("Error finding supplier:", err);
            }
        }
        
        // Fallbacks if not in session
        if (!supplierName && req.body.supplierName) {
            supplierName = req.body.supplierName;
        }
        if (!supplierId && req.body.supplierId) {
            supplierId = req.body.supplierId;
        }
        
        // Final fallback - if we still don't have supplierId, we can't create the auction
        if (!supplierId) {
            return res.status(400).send("Supplier ID is required. Please log in again.");
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
            city:city || "Not specified",
            state:state || "Not specified"
        });

        await newStock.save();
        res.redirect("/supplier/auction/auctionsView");
    } catch (err) {
        res.status(500).send("Error creating auction: " + err.message);
    }
});

// Route to start a live auction (from auctions.ejs form)
router.post("/startAuction", async (req, res) => {
    try {
        // Check if supplier is logged in
        if (!req.session.supplier) {
            return res.redirect("/supplier/login");
        }

        const { auctionId, duration } = req.body;
        if (!auctionId || !duration) {
            return res.status(400).send("Auction ID and duration are required.");
        }

        // Find the auction (stock) by ID and ensure it belongs to this supplier
        const auction = await Stock.findOne({ _id: auctionId, supplierName: req.session.supplier.name });
        if (!auction) {
            return res.status(404).send("Auction not found or not authorized.");
        }
        
        // If the auction doesn't have supplierId, add it
        if (!auction.supplierId && req.session.supplier.supplierId) {
            auction.supplierId = req.session.supplier.supplierId;
        }

        // Mark auction as "live" and set start/end time
        const now = new Date();
        const endTime = new Date(now.getTime() + parseInt(duration)  * 60 * 1000); // duration in hours converted to milliseconds

        auction.isLive = true;
        auction.auctionStart = now;
        auction.auctionEnd = endTime;
        await auction.save();

        // Notify all clients via Socket.IO that this auction is now live
        if (req.app && req.app.get("io")) {
            // If io is attached to app (best practice)
            req.app.get("io").emit("auctionStarted", {
                auctionId: auction._id,
                name: auction.name,
                basePrice: auction.basePrice,
                quantity: auction.quantity,
                supplierName: auction.supplierName,
                area: auction.area,
                city: auction.city,
                state: auction.state,
                auctionStart: auction.auctionStart,
                auctionEnd: auction.auctionEnd
            });
        } else if (global.io) {
            // Fallback if io is global
            global.io.emit("auctionStarted", {
                auctionId: auction._id,
                name: auction.name,
                basePrice: auction.basePrice,
                quantity: auction.quantity,
                supplierName: auction.supplierName,
                area: auction.area,
                city: auction.city,
                state: auction.state,
                auctionStart: auction.auctionStart,
                auctionEnd: auction.auctionEnd
            });
        }

        // Redirect back to auctions view
        res.redirect("/supplier/auction/auctionsView");
    } catch (err) {
        res.status(500).send("Error starting auction: " + err.message);
    }
});

// Route to view live auction (for vendors and suppliers)
router.get("/live-auction/:auctionId", async (req, res) => {
    try {
        const { auctionId } = req.params;
        const auction = await Stock.findById(auctionId);
        
        if (!auction) {
            return res.status(404).send("Auction not found");
        }
        
        if (!auction.isLive) {
            return res.status(400).send("This auction is not live yet");
        }
        
        // Get vendor information from session if available
        const vendor = req.session.vendor || null;
        const supplier = req.session.supplier || null;
        
        // Check if current user is the supplier who created this auction
        const isSupplierOwner = supplier && auction.supplierName === supplier.name;
        
        // If no vendor session and no supplier session, redirect to vendor login
        if (!vendor && !supplier) {
            return res.redirect("/vendor/login");
        }
        
        res.render("liveAuction", { auction, vendor, supplier, isSupplierOwner });
    } catch (err) {
        res.status(500).send("Error fetching auction: " + err.message);
    }
});

// Route to place a bid
router.post("/place-bid", async (req, res) => {
    try {
        // Check if user is logged in as a vendor
        if (!req.session.vendor) {
            return res.status(401).json({ error: "Only vendors can place bids. Please log in as a vendor." });
        }
        
        const { auctionId, vendorId, vendorName, vendorPhone, vendorEmail, vendorAddress, bidAmount } = req.body;
        
        const auction = await Stock.findById(auctionId);
        if (!auction || !auction.isLive) {
            return res.status(400).json({ error: "Auction not found or not live" });
        }
        
        // Ensure vendor is not bidding on their own auction (if they somehow got access)
        if (auction.supplierName === req.session.vendor.name) {
            return res.status(403).json({ error: "You cannot bid on your own auction" });
        }
        
        if (bidAmount <= auction.currentBid) {
            return res.status(400).json({ error: "Bid must be higher than current bid" });
        }
        
        // Update auction with new bid
        auction.currentBid = bidAmount;
        auction.currentBidder = vendorName;
        

        
        auction.bidders.push({
            vendorId,
            vendorName,
            vendorPhone: vendorPhone || 'N/A',
            vendorEmail: vendorEmail || 'N/A',
            vendorAddress: vendorAddress || 'N/A',
            bidAmount,
            bidTime: new Date()
        });
        
        await auction.save();
        
        // Emit to all connected clients
        const io = req.app.get("io");
        if (io) {
            io.to(`auction_${auctionId}`).emit('newBid', {
                auctionId,
                vendorId,
                vendorName,
                bidAmount,
                timestamp: new Date()
            });
        }
        
        res.json({ success: true, currentBid: bidAmount });
    } catch (err) {
        res.status(500).json({ error: "Error placing bid: " + err.message });
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
        // Find all stock items for this supplier to populate the dropdown
        const stocks = await Stock.find({ supplierId: req.session.supplier.supplierId });

        // For each auction, if it is ended and has bidders, attach winner details
        const auctionsWithWinner = auctions.map(auction => {
            let winner = null;
            if ((auction.status === 'ended' || (auction.auctionEnd && auction.auctionEnd < new Date())) && auction.bidders && auction.bidders.length > 0) {
                // Winner is the last/highest bidder (for normal auction)
                // If you want the highest bid, sort by bidAmount descending
                const sortedBidders = [...auction.bidders].sort((a, b) => b.bidAmount - a.bidAmount);
                const winningBidder = sortedBidders[0];
                winner = {
                    name: winningBidder.vendorName,
                    email: winningBidder.vendorEmail,
                    city: winningBidder.vendorAddress, // If you store city separately, use that field
                    mobile: winningBidder.vendorPhone,
                    bidAmount: winningBidder.bidAmount
                };
            }
            return { ...auction.toObject(), winner };
        });

        res.render("auctions", { auctions: auctionsWithWinner, stocks, supplier: req.session.supplier });
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
        return res.redirect("/supplier/login");
    }
    res.render("supplier", { supplier: req.session.supplier });
});

// Route to view vendor requirements
router.get("/requirements", async (req, res) => {
    try {
        if (!req.session.supplier) {
            return res.redirect("/supplier/login");
        }

        // Get all stock items for this supplier
        const supplierStocks = await Stock.find({
            supplierId: req.session.supplier.supplierId
        });

        // Extract stock names and convert to lowercase for matching
        const stockNames = supplierStocks.map(stock => stock.name.toLowerCase().trim());

        // Find requirements that match supplier's stock items
        const allRequirements = await Requirement.find({ status: 'pending' }).sort({ createdAt: -1 });

        // Match only item name, ignore city
        const matchingRequirements = allRequirements.filter(requirement => {
            if (!requirement.itemName) return false;
            const requirementItemName = requirement.itemName.toLowerCase().trim();
            return stockNames.some(stockName => stockName === requirementItemName);
        });

        res.render("supplierRequirements", {
            requirements: matchingRequirements,
            supplier: req.session.supplier,
            success: req.session.successMessage
        });
        req.session.successMessage = undefined;
    } catch (err) {
        res.status(500).send("Error fetching requirements: " + err.message);
    }
});

// Route to respond to a requirement
router.post("/respond-requirement", async (req, res) => {
    try {
        if (!req.session.supplier) {
            return res.redirect("/supplier/login");
        }
        
        const { requirementId, message, proposedPrice, proposedQuantity } = req.body;
        
        // Check if required fields are present
        if (!message || !proposedPrice || !proposedQuantity) {
            return res.status(400).send("All fields are required: message, proposed price, and proposed quantity.");
        }
        
        const requirement = await Requirement.findById(requirementId);
        if (!requirement) {
            return res.status(404).send("Requirement not found");
        }
        
        // Validate and parse numeric values
        const parsedPrice = parseFloat(proposedPrice);
        const parsedQuantity = parseInt(proposedQuantity);
        
        // Check if parsing resulted in NaN
        if (isNaN(parsedPrice)) {
            return res.status(400).send("Invalid proposed price. Please enter a valid number.");
        }
        
        if (isNaN(parsedQuantity)) {
            return res.status(400).send("Invalid proposed quantity. Please enter a valid number.");
        }
        
        // Add supplier response
        requirement.supplierResponses.push({
            supplierId: req.session.supplier.supplierId,
            supplierName: req.session.supplier.name,
            supplierPhone: req.session.supplier.phone,
            supplierEmail: req.session.supplier.email,
            message,
            proposedPrice: parsedPrice,
            proposedQuantity: parsedQuantity
        });
        
        await requirement.save();
        
        // Set session-based flash message
        req.session.successMessage = true;
        res.redirect("/supplier/requirements");
    } catch (err) {
        res.status(500).send("Error responding to requirement: " + err.message);
    }
});

// ========== SUPPLIER VENDOR AUCTION ROUTES ==========

// Function to update vendor auction status based on time
async function updateVendorAuctionStatus() {
    try {
        const now = new Date();
        // Update live auctions that have ended
        const endedAuctions = await VendorAuction.find({
            status: 'live',
            isLive: true,
            auctionEnd: { $lte: now }
        });
        for (const auction of endedAuctions) {
            // Find the lowest bid (for reverse auction)
            if (auction.bidders && auction.bidders.length > 0) {
                const winningBidder = auction.bidders.reduce((min, b) => b.bidAmount < min.bidAmount ? b : min, auction.bidders[0]);
                auction.winner = {
                    supplierId: winningBidder.supplierId,
                    supplierName: winningBidder.supplierName,
                    supplierPhone: winningBidder.supplierPhone,
                    supplierEmail: winningBidder.supplierEmail,
                    supplierAddress: winningBidder.supplierAddress,
                    winningBid: winningBidder.bidAmount,
                    winTime: new Date()
                };
            }
            auction.status = 'ended';
            auction.isLive = false;
            await auction.save();
        }
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
        console.error('Error updating vendor auction status:', err);
    }
}

// Route to view all vendor auctions
router.get("/vendor-auctions", async (req, res) => {
    try {
        if (!req.session.supplier) {
            return res.redirect("/supplier/login");
        }
        // Update auction status before fetching
        await updateVendorAuctionStatus();

        // Fetch both live and ended auctions for the supplier
        const auctions = await VendorAuction.find({
            // Optionally, you can filter by supplierId if needed
        }).sort({ auctionStart: -1 });

        // Attach winner details for ended auctions
        const auctionsWithWinner = auctions.map(auction => {
            let winner = null;
            if ((auction.status === 'ended' || (auction.auctionEnd && auction.auctionEnd < new Date())) && auction.bidders && auction.bidders.length > 0) {
                // Winner is the lowest bidder (reverse auction)
                const winningBidder = auction.bidders.reduce((min, b) => b.bidAmount < min.bidAmount ? b : min, auction.bidders[0]);
                winner = {
                    name: winningBidder.supplierName,
                    email: winningBidder.supplierEmail,
                    city: winningBidder.supplierCity || '',
                    mobile: winningBidder.supplierPhone,
                    bidAmount: winningBidder.bidAmount
                };
            }
            return { ...auction.toObject(), winner };
        });

        res.render("supplierVendorAuctions", {
            auctions: auctionsWithWinner,
            supplier: req.session.supplier
        });
    } catch (err) {
        res.status(500).send("Error fetching vendor auctions: " + err.message);
    }
});

// Route to view a specific vendor auction
router.get("/vendor-auction/:auctionId", async (req, res) => {
    try {
        if (!req.session.supplier) {
            return res.redirect("/supplier/login");
        }
        
        const { auctionId } = req.params;
        
        // Update auction status before fetching
        await updateVendorAuctionStatus();
        
        const auction = await VendorAuction.findById(auctionId);
        
        if (!auction) {
            return res.status(404).send("Auction not found");
        }
        
        res.render("supplierVendorAuction", { 
            auction, 
            supplier: req.session.supplier 
        });
    } catch (err) {
        res.status(500).send("Error loading auction: " + err.message);
    }
});

// Route to place a bid on vendor auction
router.post("/place-vendor-bid", async (req, res) => {
    try {
        console.log('Bid request received:', req.body);
        console.log('Session supplier:', req.session.supplier);
        
        if (!req.session.supplier) {
            console.log('No supplier session found');
            return res.status(401).json({ success: false, error: "Not authenticated" });
        }
        
        const { auctionId, bidAmount } = req.body;
        console.log('Auction ID:', auctionId);
        console.log('Bid amount:', bidAmount);
        
        const auction = await VendorAuction.findById(auctionId);
        console.log('Found auction:', auction ? 'Yes' : 'No');
        
        if (!auction) {
            console.log('Auction not found');
            return res.status(404).json({ success: false, error: "Auction not found" });
        }
        
        console.log('Auction status:', auction.status);
        console.log('Auction isLive:', auction.isLive);
        
        if (auction.status !== 'live' || !auction.isLive) {
            console.log('Auction is not live');
            return res.status(400).json({ success: false, error: "Auction is not live" });
        }
        
        // Validate bid amount (must be lower than current lowest bid or base price)
        const currentLowest = auction.currentLowestBid || auction.basePrice;
        console.log('Current lowest bid:', currentLowest);
        console.log('New bid amount:', parseFloat(bidAmount));
        
        if (parseFloat(bidAmount) >= currentLowest) {
            console.log('Bid amount too high');
            return res.status(400).json({ 
                success: false, 
                error: "Your bid must be lower than the current lowest bid" 
            });
        }
        
        // Construct supplier address
        const supplierAddress = [
            req.session.supplier.address,
            req.session.supplier.area,
            req.session.supplier.city,
            req.session.supplier.state
        ].filter(Boolean).join(', ');
        
        // Add bid to auction
        auction.bidders.push({
            supplierId: req.session.supplier.supplierId,
            supplierName: req.session.supplier.name,
            supplierPhone: req.session.supplier.phone,
            supplierEmail: req.session.supplier.email,
            supplierAddress: supplierAddress || 'Address not provided',
            supplierCity: req.session.supplier.city,
            bidAmount: parseFloat(bidAmount),
            bidTime: new Date()
        });
        
        // Update current lowest bid
        auction.currentLowestBid = parseFloat(bidAmount);
        auction.currentLowestBidder = req.session.supplier.name;
        
        await auction.save();
        
        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('vendorAuctionBid', {
                auctionId: auction._id,
                supplierName: req.session.supplier.name,
                bidAmount: parseFloat(bidAmount),
                currentLowestBid: parseFloat(bidAmount)
            });
        }
        
        res.json({ success: true, message: "Bid placed successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
