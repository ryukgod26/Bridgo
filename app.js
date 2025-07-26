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
const supplierAuth=require("./controllers/supplierAuth");
const vendorAuth=require("./controllers/vendorAuth");



app.use("/vendor",vendorRouter);
app.use("/supplier",supplierRouter);
app.use("/",vendorAuth);
app.use("/",supplierAuth);
app.use("/",homeRouter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log(""))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
});

module.exports = { io };
