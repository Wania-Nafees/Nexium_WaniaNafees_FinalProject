import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const options = {};

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// In dev, use a global var so HMR doesn't open many connections
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
