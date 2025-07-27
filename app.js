require('dotenv').config();
// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const socketIO = require('socket.io');
const path=require("path");
const session = require('express-session');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*"
  }
});

// Attach io to app for use in routes
app.set("io", io);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.set("view engine","ejs");

// Session middleware configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(cors());
app.use(express.json());

const homeRouter=require("./routes/homeRouter");
const vendorRouter = require('./routes/vendorRouter');
const supplierRouter= require('./routes/supplierRouter');



app.use("/vendor",vendorRouter);
app.use("/supplier",supplierRouter);
app.use("/",homeRouter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {

}).then(() => console.log(""))
  .catch(err => console.error(err));

// Socket.IO event handlers
io.on('connection', (socket) => {
  // console.log('A user connected:', socket.id);

  // Join auction room
  socket.on('joinAuction', (auctionId) => {
    socket.join(`auction_${auctionId}`);
    // console.log(`User ${socket.id} joined auction ${auctionId}`);
  });

  // Leave auction room
  socket.on('leaveAuction', (auctionId) => {
    socket.leave(`auction_${auctionId}`);
    // console.log(`User ${socket.id} left auction ${auctionId}`);
  });

  // Handle new bids
  socket.on('placeBid', async (data) => {
    try {
      const { auctionId, vendorId, vendorName, bidAmount } = data;
      
      // Emit to all users in the auction room (including sender)
      io.to(`auction_${auctionId}`).emit('newBid', {
        auctionId,
        vendorId,
        vendorName,
        bidAmount,
        timestamp: new Date()
      });
      

    } catch (error) {
      console.error('Error handling bid:', error);
    }
  });

  // Handle auction end
  socket.on('auctionEnded', (auctionId) => {
    io.to(`auction_${auctionId}`).emit('auctionEnded', {
      auctionId,
      timestamp: new Date()
    });
    // console.log(`Auction ${auctionId} ended`);
  });

  socket.on('disconnect', () => {
    // console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };
