import mongoose from "mongoose";
import dns from "node:dns";

// Configure DNS resolution specifically for environments where local/ISP DNS fails Node's SRV resolution
function configureDns() {
  const isDev = process.env.NODE_ENV !== "production";
  const customServers = process.env.MONGODB_DNS_SERVERS;

  if (customServers) {
    const servers = customServers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length > 0) {
      try {
        dns.setDefaultResultOrder?.("ipv4first");
        dns.setServers(servers);
        return;
      } catch {
        // Fall through on error
      }
    }
  }

  // In development environments (particularly on Windows where Node.js c-ares DNS resolver
  // fails SRV queries on local routers/ISPs), configure Google DNS fallback (8.8.8.8, 8.8.4.4).
  if (isDev) {
    try {
      dns.setDefaultResultOrder?.("ipv4first");
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    } catch {
      // In restricted or browser runtimes, skip gracefully
    }
  }
}

// Run DNS configuration before connection setup
configureDns();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  // Ensure DNS configuration is applied prior to initiating connection attempt
  configureDns();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
