const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        // Try connecting to provided URI first (local/atlas)
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Fail fast if local not running
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log('Local MongoDB not found. Starting Embedded MongoDB (Memory Server)...');
        try {
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            console.log(`Embedded MongoDB URI: ${uri}`);

            const conn = await mongoose.connect(uri);
            console.log(`Embedded MongoDB Connected: ${conn.connection.host}`);
        } catch (err) {
            console.error(`Error: ${err.message}`);
            process.exit(1);
        }
    }
};

module.exports = connectDB;
