export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    try {
      dns.setDefaultResultOrder?.("ipv4first");
      const custom = process.env.MONGODB_DNS_SERVERS;
      if (custom) {
        const servers = custom.split(",").map((s) => s.trim()).filter(Boolean);
        if (servers.length > 0) {
          dns.setServers(servers);
          return;
        }
      }
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // In non-standard or restricted Node environments, continue safely
    }
  }
}

