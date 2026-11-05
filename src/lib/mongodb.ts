import dns from "node:dns";
import mongoose from "mongoose";

// Configure Node.js DNS servers (Google & Cloudflare fallback)
function configureDns() {
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

  try {
    dns.setDefaultResultOrder?.("ipv4first");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // In restricted runtimes, skip gracefully
  }
}

// Run DNS configuration immediately upon module evaluation
configureDns();

/**
 * Dedicated DNS Resolver strategy:
 * If the connection string is a `mongodb+srv://` URI, Windows' default DNS resolver can
 * cause ECONNREFUSED when querying SRV/TXT records.
 * We resolve the SRV hosts and TXT options using a dedicated dns.promises.Resolver with
 * fallback DNS servers ('8.8.8.8', '1.1.1.1') before passing to Mongoose.
 */
async function resolveMongoConnectionUri(rawUri: string): Promise<string> {
  if (!rawUri.startsWith("mongodb+srv://")) {
    return rawUri;
  }

  const srvRegex = /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/;
  const match = rawUri.match(srvRegex);
  if (!match) {
    return rawUri;
  }

  const [, username, password, host, pathPart, queryPart] = match;

  try {
    const resolver = new dns.promises.Resolver();
    const customServers = process.env.MONGODB_DNS_SERVERS;
    const servers = customServers
      ? customServers.split(",").map((s) => s.trim()).filter(Boolean)
      : ["8.8.8.8", "1.1.1.1"];
    resolver.setServers(servers);

    // Resolve SRV records for the cluster
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
    if (!srvRecords || srvRecords.length === 0) {
      return rawUri;
    }

    // Resolve optional TXT records for replicaSet and authSource
    const txtRecords = await resolver.resolveTxt(host).catch(() => []);
    const txtString = txtRecords.flat().join("&");

    const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const existingParams = queryPart ? queryPart.slice(1) : "";

    const combinedParams = [txtString, existingParams, "ssl=true"]
      .filter(Boolean)
      .join("&");

    const pathString = pathPart || "/";
    return `mongodb://${username}:${password}@${hostList}${pathString}?${combinedParams}`;
  } catch (error) {
    console.warn("Dedicated DNS SRV resolution warning, falling back to raw URI:", error);
    return rawUri;
  }
}

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

    cached.promise = (async () => {
      const resolvedUri = await resolveMongoConnectionUri(uri);
      return mongoose.connect(resolvedUri, opts);
    })();
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
