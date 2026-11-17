import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subhash_repair_shop';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DATABASE] MongoDB Connected Successfully: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[DATABASE] Connection Error: ${error.message}`);
    console.error(`[DATABASE] MongoDB URI: ${mongoUri}`);
    console.error(`[DATABASE] Ensure local MongoDB Server (mongod) is running on port 27017.`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DATABASE] MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DATABASE] MongoDB reconnected successfully.');
});

export default connectDB;
