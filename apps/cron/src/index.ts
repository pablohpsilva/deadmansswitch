import * as cron from "node-cron";
import {
  scheduledFunction,
  inactivityFunction,
  cleanupFunction,
} from "./scheduler.js";

console.log("🕐 Starting Dead Man's Switch Cron Service...");

// Schedule the main email sending job to run every 30 minutes
const emailJob = cron.schedule("*/30 * * * *", async () => {
  console.log("⏰ Running scheduled email check...");
  try {
    await scheduledFunction();
    console.log("✅ Scheduled email check completed");
  } catch (error) {
    console.error("❌ Scheduled email check failed:", error);
  }
});

// Schedule the user inactivity check to run every hour
const inactivityJob = cron.schedule("0 * * * *", async () => {
  console.log("⏰ Running user inactivity check...");
  try {
    await inactivityFunction();
    console.log("✅ User inactivity check completed");
  } catch (error) {
    console.error("❌ User inactivity check failed:", error);
  }
});

// Schedule the cleanup job to run daily at 2 AM
const cleanupJob = cron.schedule("0 2 * * *", async () => {
  console.log("⏰ Running daily cleanup...");
  try {
    await cleanupFunction();
    console.log("✅ Daily cleanup completed");
  } catch (error) {
    console.error("❌ Daily cleanup failed:", error);
  }
});

// Start all scheduled jobs
emailJob.start();
inactivityJob.start();
cleanupJob.start();

console.log("🚀 Cron jobs started successfully!");
console.log("📧 Email check: every 30 minutes");
console.log("👤 Inactivity check: every hour");
console.log("🧹 Cleanup: daily at 2 AM");

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down cron service...");
  emailJob.stop();
  inactivityJob.stop();
  cleanupJob.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down cron service...");
  emailJob.stop();
  inactivityJob.stop();
  cleanupJob.stop();
  process.exit(0);
});
