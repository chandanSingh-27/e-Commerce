const dns = require('dns');
const mongoose = require('mongoose');

// Fix for Windows & local ISP DNS failure with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

/**
 * Connect to MongoDB using mongoose.
 * Sets up connection event listeners for logging lifecycle events.
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is undefined. Please ensure you have created a "server/.env" file containing your MongoDB Atlas connection string (MONGODB_URI=mongodb+srv://...).'
      );
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Attempting reconnection...');
});

module.exports = connectDB;
