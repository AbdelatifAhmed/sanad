const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const { z } = require("zod");
const connectDB = require("../../config/db");
const User = require("../../models/user.schema");
const SessionManager = require("./sessionManager");
const llm = require("../../config/llm");
const guardianShieldAgent = require("./agents/guardianShieldAgent");
const { orchestrateAiChat } = require("./orchestrator");
const {
  extractFamilySearchQuery,
  searchFamilyCompanions,
} = require("./tools/familySearchTool");
const {
  getUpcomingFamilyBookings,
  getCompanionActiveBookings,
  auditCompanionScheduleConflict,
} = require("./tools/calendarTool");

const print = (title, value) => {
  console.log(`\n=== ${title} ===`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
};

const getOrCreateFamilyUser = async () => {
  let user = await User.findOne({ role: "family" });
  if (user) return user;

  return User.create({
    name: "AI Smoke Family",
    email: `ai-smoke-family-${Date.now()}@example.com`,
    passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
    phone: "01000000000",
    role: "family",
    location: {
      geo: { type: "Point", coordinates: [31.2357, 30.0444] },
      readableAddress: "Maadi, Cairo",
      city: "Cairo",
      governorate: "Cairo",
    },
  });
};

async function runTests() {
  console.log("Connecting to database...");
  await connectDB();

  try {
    const familyUser = await getOrCreateFamilyUser();
    const companionUser = await User.findOne({ role: "companion" });

    print("0. Dynamic LLM Config", {
      activeModel: llm.models?.[0],
      fallbackModels: llm.models,
      timeoutMs: llm.timeoutMs,
    });

    const echoSchema = z.object({
      ok: z.boolean(),
      intent: z.string(),
    });
    const structuredEcho = await llm.withStructuredOutput(echoSchema).invoke([
      { role: "system", content: "Return JSON confirming the AI gateway is reachable." },
      { role: "user", content: "Say ok true and intent smoke_test." },
    ]);
    print("1. LLM Structured Output", structuredEcho);

    await SessionManager.clearSession(familyUser._id, "family_assistant");
    await SessionManager.addMessage(familyUser._id, "family", "user", "Hello there");
    await SessionManager.addMessage(familyUser._id, "family", "ai", "Hello! How can I help?");
    const history = await SessionManager.getFormattedHistory(familyUser._id, "family");
    print("2. SessionManager", history.map((msg) => ({
      type: msg.constructor.name,
      content: msg.content,
    })));

    const cleanAudit = await guardianShieldAgent.analyzeMessage("I need a nurse for my father.");
    const unsafeAudit = await guardianShieldAgent.analyzeMessage("Call me on 01023456789 and I will pay cash outside Sanad.");
    print("3. GuardianShield", { cleanAudit, unsafeAudit });

    const searchQuery = "عايز مرافق رخيص شاطر في الزهايمر ومتاح يوم الخميس ومناسب لميزانية 80 جنيه في القاهرة";
    const extracted = await extractFamilySearchQuery(searchQuery, "ar");
    print("4. Family Search Extraction", extracted);

    const searchResult = await searchFamilyCompanions({
      query: searchQuery,
      filters: extracted,
      limit: 5,
    });
    print("5. Family Hybrid Search", {
      filters: searchResult.filters,
      count: searchResult.companions.length,
      sample: searchResult.companions.slice(0, 2),
    });

    const familyBookings = await getUpcomingFamilyBookings(familyUser._id);
    print("6. Family Calendar Fetch", {
      count: familyBookings.length,
      sample: familyBookings.slice(0, 2),
    });

    if (companionUser) {
      const companionBookings = await getCompanionActiveBookings(companionUser._id);
      const conflictAudit = await auditCompanionScheduleConflict(companionUser._id, {
        day: "Thursday",
        startTime: "10:00",
        endTime: "12:00",
      });
      print("7. Companion Schedule Audit", {
        companionUserId: companionUser._id,
        activeBookings: companionBookings.length,
        hasConflict: conflictAudit.hasConflict,
        messageAr: conflictAudit.messageAr,
        messageEn: conflictAudit.messageEn,
      });
    } else {
      print("7. Companion Schedule Audit", "Skipped: no companion user found in database.");
    }

    const platformQa = await orchestrateAiChat(
      familyUser._id,
      "ما هي قواعد تسجيل الحضور والانصراف في سند؟",
      "family_assistant",
      "ar"
    );
    print("8. Orchestrator Platform Q&A", platformQa);

    const familySearchChat = await orchestrateAiChat(
      familyUser._id,
      searchQuery,
      "family_assistant",
      "ar"
    );
    print("9. Orchestrator Family Search", {
      responseType: familySearchChat.responseType,
      reply: familySearchChat.reply,
      activeFilters: familySearchChat.activeFilters,
      resultCount: familySearchChat.results.length,
    });

    const violation = await orchestrateAiChat(
      familyUser._id,
      "رقمي 01023456789 وكلم المرافق خارج التطبيق",
      "family_assistant",
      "ar"
    );
    print("10. Orchestrator Safety Violation", violation);

    console.log("\nAI smoke test completed.");
  } catch (error) {
    console.error("AI smoke test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

runTests();
