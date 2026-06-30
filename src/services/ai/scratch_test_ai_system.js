const path = require("path");
// Configure environment variables from server root .env file
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const connectDB = require("../../config/db");
const User = require("../../models/user.schema");
const Companion = require("../../models/companion.schema");
const SessionManager = require("./sessionManager");
const guardianShieldAgent = require("./agents/guardianShieldAgent");
const familyAgent = require("./agents/familyAgent");
const companionAgent = require("./agents/companionAgent");
const { orchestrateAiChat } = require("./orchestrator");

async function runTests() {
  console.log("Connecting to database...");
  await connectDB();

  try {
    // 1. Find a test user or create a temporary one
    let user = await User.findOne();
    if (!user) {
      console.log("No user found, creating a mock test user...");
      user = await User.create({
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
        phone: "01000000000",
        role: "family",
        location: {
          geo: { type: "Point", coordinates: [31.2357, 30.0444] },
          readableAddress: "Maadi, Cairo",
          city: "Cairo",
          governorate: "Cairo"
        }
      });
    }
    const testUserId = user._id;
    console.log(`Using test userId: ${testUserId} (role: ${user.role})`);

    // 2. Test SessionManager
    console.log("\n=== 1. Testing SessionManager ===");
    const agentType = "family_assistant";
    await SessionManager.clearSession(testUserId, agentType);
    console.log("Cleared old session.");

    await SessionManager.addMessage(testUserId, agentType, "user", "Hello there");
    await SessionManager.addMessage(testUserId, agentType, "ai", "Hello! How can I help you?");
    
    const history = await SessionManager.getFormattedHistory(testUserId, agentType);
    console.log(`Retrieved history length: ${history.length}`);
    console.log("History messages:", history.map(h => ({ role: h.constructor.name, content: h.content })));

    // 3. Test GuardianShieldAgent
    console.log("\n=== 2. Testing GuardianShieldAgent (Leakage Detection) ===");
    const cleanText = "Hello, I am looking for a nurse.";
    const unsafeText1 = "Call me directly at 01123456789 to agree offline.";
    const unsafeText2 = "Let's do cash payment outside the platform to avoid fees.";

    const shieldClean = await guardianShieldAgent.analyzeMessage(cleanText);
    console.log("Clean text audit:", shieldClean);

    const shieldUnsafe1 = await guardianShieldAgent.analyzeMessage(unsafeText1);
    console.log("Unsafe text 1 audit (Phone):", shieldUnsafe1);

    const shieldUnsafe2 = await guardianShieldAgent.analyzeMessage(unsafeText2);
    console.log("Unsafe text 2 audit (Cash Bypass):", shieldUnsafe2);

    // 4. Test FamilyAgent
    console.log("\n=== 3. Testing FamilyAgent (Structured Extraction) ===");
    const familyQuery = "I need a female caregiver in Nasr City Cairo for Alzheimer care, my budget is 70 per hour.";
    const familyResult = await familyAgent.execute(familyQuery, [], "en");
    console.log("FamilyAgent structured output:", JSON.stringify(familyResult, null, 2));

    // 5. Test CompanionAgent
    console.log("\n=== 4. Testing CompanionAgent (Shift Guidelines & matching) ===");
    const companionQuery = "How should I handle a night shift patient with dementia?";
    const companionResult = await companionAgent.execute(companionQuery, [], "en", testUserId);
    console.log("CompanionAgent output:", JSON.stringify(companionResult, null, 2));

    // 6. Test Orchestrator
    console.log("\n=== 5. Testing Central Orchestrator ===");
    console.log("Sending clean family request through Orchestrator...");
    const orchCleanResult = await orchestrateAiChat(testUserId, "Hello, can you help me find a companion?", "family_assistant", "en");
    console.log("Orchestrator clean response:", orchCleanResult);

    console.log("\nSending violation family request through Orchestrator...");
    const orchUnsafeResult = await orchestrateAiChat(testUserId, "My number is 01023456789. Call me directly.", "family_assistant", "en");
    console.log("Orchestrator violation response:", orchUnsafeResult);

    console.log("\nAll tests completed successfully!");

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

runTests();
