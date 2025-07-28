# Bridgo

![Bridgo Logo](public/images/logo.png)

This is our website which will provide an interface for both local street vendors and their suppliers to buy or sell items at competitive prize. Our idea is inspired from auctions happening in local markets(mandi) where auctions are held every morning to buy or sell goods. Our website follows the same pattern where both vendors and suppliers can organize or join an auction. The difference is vendors will bid for the highest amount ( traditional mandi style) and suppliers will bid for lowest amount.
Additionally, vendors can also submit their requirements, which will be displayed to the suppliers directly and they can respond to the demand without any auction. 

## Features

### For Vendors:
- Submit requirements for items needed
- Create auctions for items they want to sell
- Bid with highest amount (traditional mandi style)
- Set auction start and end times
- Join live auctions

### For Suppliers:
- List stock with item details (name, quantity, price)
- Create auctions for their products
- Bid with lowest amount to win contracts
- Respond to vendor requirements directly
- Participate in real-time auctions

## Installation and Setup

### Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (version 14.x or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/ryukgod26/Bridgo.git
cd Bridgo
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory and add the following environment variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bridgo
# Or use MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bridgo

# JWT Secret Key
JWT_KEY=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Step 4: Database Setup
Make sure MongoDB is running on your system:

**For Local MongoDB:**
```bash
# Start MongoDB service (Windows)
net start MongoDB

# Start MongoDB service (macOS/Linux)
sudo service mongod start
```

**For MongoDB Atlas:**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a new cluster
- Get your connection string and update the `MONGODB_URI` in your `.env` file

### Step 5: Run the Application

#### Development Mode (with automatic restart on file changes):
```bash
npx nodemon app.js
```

#### Production Mode:
```bash
node app.js
```

### Step 6: Access the Application
Open your web browser and navigate to:
```
http://localhost:5000
```

## Project Structure
```
Bridgo/
├── app.js                 # Main application entry point
├── package.json          # Project dependencies and scripts
├── config/               # Configuration files
│   ├── cloudinaryupload.js
│   ├── keys.js
│   └── mongooseConnection
├── controllers/          # Route controllers
│   ├── supplierAuth.js
│   └── vendorAuth.js
├── models/              # Database models
│   ├── requirement.js
│   ├── stock.js
│   ├── supplierDetails.js
│   ├── vendorAuction.js
│   └── vendorDetails.js
├── routes/              # API routes
│   ├── homeRouter.js
│   ├── supplierRouter.js
│   └── vendorRouter.js
├── views/               # EJS templates
│   └── [various .ejs files]
├── public/              # Static assets
│   ├── images/
│   ├── javascripts/
│   └── stylesheets/
└── uploads/             # File uploads directory
```

## Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Real-time Communication:** Socket.io
- **File Upload:** Multer, Cloudinary
- **Template Engine:** EJS
- **Session Management:** express-session

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   ```bash
   Error: listen EADDRINUSE :::5000
   ```
   Solution: Change the PORT in your `.env` file or kill the process using port 5000.

2. **MongoDB connection error:**
   ```bash
   MongoNetworkError: failed to connect to server
   ```
   Solution: Make sure MongoDB is running or check your connection string.

3. **Missing dependencies:**
   ```bash
   Error: Cannot find module 'xyz'
   ```
   Solution: Run `npm install` to install all dependencies.

For the process of auction for vendor, he/she will mention the name of the item he/she wants, quantity and amount and can list the auction after giving start and end time( however can start the auction before time).

For supplier auction process, he/she first list the stock which will contain the same details like name, quantity, prize and can start the auction.
