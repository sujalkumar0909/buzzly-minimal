// src/lib/db.ts
import mongoose, { Connection as MongooseConnection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // This runtime check ensures MONGODB_URI is a string if the code proceeds.
  throw new Error(
    'CRITICAL: MONGODB_URI is not defined. Check .env.local or environment config.'
  );
}
// At this point, MONGODB_URI is guaranteed to be a string.

interface CachedMongoose {
  conn: MongooseConnection | null;
  promise: Promise<MongooseConnection> | null;
}

// Using a more unique global variable name to avoid potential conflicts
let cached: CachedMongoose = (global as any).__buzzly_minimal_mongoose_cache;

if (!cached) {
  cached = (global as any).__buzzly_minimal_mongoose_cache = { conn: null, promise: null };
}

async function dbConnect(): Promise<MongooseConnection> {
  if (cached.conn) {
    if (cached.conn.readyState === 1) { // 1 === connected
      return cached.conn;
    }
    console.warn(`DB: Cached connection readyState is ${cached.conn.readyState}. Re-attempting.`);
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    console.log('DB: Creating new database connection promise.');
    // Use MONGODB_URI directly here. The check at the top of the file guarantees it's a string.
    // If TypeScript still complains, the non-null assertion MONGODB_URI! can be used.
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => { // <--- MONGODB_URI used here
      console.log("DB: Mongoose connected successfully via new promise!");
      
      const connection = mongooseInstance.connection;
      connection.on('error', (err) => {
        console.error("DB: Mongoose connection error event:", err);
        cached.conn = null;
        cached.promise = null; // Clear promise so new attempt can be made
      });
      connection.on('disconnected', () => {
        console.warn("DB: Mongoose connection disconnected event.");
        cached.conn = null;
        cached.promise = null; // Clear promise
      });
      return connection;
    }).catch(err => {
        console.error("DB: Initial mongoose.connect() promise rejected:", err.message);
        cached.promise = null;
        throw err;
    });
  }

  try {
    console.log('DB: Awaiting connection promise to resolve.');
    cached.conn = await cached.promise;
  } catch (e: any) {
    console.error("DB: Error awaiting connection promise:", e.message);
    cached.promise = null;
    throw e;
  }
  
  if (cached.conn && cached.conn.readyState === 1) {
    console.log("DB: Connection active after promise resolution.");
  } else {
    console.error("DB: Post-promise, connection not active. State:", cached.conn?.readyState);
    throw new Error("DB: Failed to establish an active connection.");
  }
  return cached.conn;
}

export default dbConnect;