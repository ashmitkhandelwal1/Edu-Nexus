import dns from "node:dns";
import connectToDatabase from "../src/lib/mongodb";
import User from "../src/models/User";
import { hashPassword } from "../src/lib/auth";

// Ensure DNS resolution order for local network/ISP environments
try {
  dns.setDefaultResultOrder?.("ipv4first");
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.includes("127.0.0.1")) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch {
  // Ignore in restricted environments
}

async function createAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // Validation
  const missingFields: string[] = [];
  if (!name) missingFields.push("ADMIN_NAME");
  if (!email) missingFields.push("ADMIN_EMAIL");
  if (!password) missingFields.push("ADMIN_PASSWORD");

  if (missingFields.length > 0) {
    console.error(
      `[Error] Missing required environment variable(s): ${missingFields.join(", ")}`
    );
    console.error("Please configure them in your .env.local file or shell environment.");
    process.exit(1);
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email!)) {
    console.error("[Error] ADMIN_EMAIL must be a valid email address format.");
    process.exit(1);
  }

  if (password!.length < 8) {
    console.error("[Error] ADMIN_PASSWORD must be at least 8 characters long.");
    process.exit(1);
  }

  try {
    const mongoose = await connectToDatabase();
    console.log("[Info] Connected to database.");

    // Check for existing user with this email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(
        `[Notice] An account with email "${email}" already exists with role: "${existingUser.role}". No changes were made.`
      );
      await mongoose.disconnect();
      console.log("[Info] Database connection closed.");
      process.exit(0);
    }

    // Hash password securely using existing auth utility
    const hashedPassword = await hashPassword(password!);

    // Create Admin User
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log(`[Success] Initial admin account for "${email}" created successfully.`);

    await mongoose.disconnect();
    console.log("[Info] Database connection closed.");
    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected database error";
    console.error(`[Error] Failed to create admin account: ${message}`);
    process.exit(1);
  }
}

createAdmin();

