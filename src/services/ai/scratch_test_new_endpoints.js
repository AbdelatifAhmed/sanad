const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const connectDB = require("../../config/db");
const User = require("../../models/user.schema");
const Skill = require("../../models/skills.schema");
const aiController = require("../../controllers/aiController");
const familySearchController = require("../../controllers/ai/familySearch.controller");
const carePlanController = require("../../controllers/ai/carePlan.controller");

const makeMockRes = (label) => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      console.log(`\n=== ${label} ===`);
      console.log(JSON.stringify({ statusCode: this.statusCode, payload }, null, 2));
      return this;
    },
  };
  return res;
};

const getOrCreateFamilyUser = async () => {
  let user = await User.findOne({ role: "family" });
  if (user) return user;

  return User.create({
    name: "AI Endpoint Family",
    email: `ai-endpoint-family-${Date.now()}@example.com`,
    passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
    phone: "01000000000",
    role: "family",
    location: {
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

    await aiController.handleFamilyChat(
      {
        user: { id: familyUser._id, _id: familyUser._id },
        body: {
          lang: "ar",
          message: "ما هي خدمات سند وقواعد الدفع الآمن؟",
        },
        headers: { "accept-language": "ar" },
      },
      makeMockRes("1. POST /api/ai/session/family - Platform Q&A")
    );

    await familySearchController.browseSearch(
      {
        user: { id: familyUser._id, _id: familyUser._id },
        body: {
          query: "محتاج مرافقة سيدة في القاهرة خبرة زهايمر يوم الخميس وسعرها أقل من 100 جنيه",
          limit: 5,
        },
        headers: { "accept-language": "ar" },
      },
      makeMockRes("2. POST /api/ai/family/browse-search")
    );

    if (companionUser) {
      await aiController.handleCompanionChat(
        {
          user: { id: companionUser._id, _id: companionUser._id },
          body: {
            lang: "ar",
            message: "جالي طلب جديد يوم الخميس من 10:00 إلى 12:00، هل مناسب لجدولي؟",
          },
          headers: { "accept-language": "ar" },
        },
        makeMockRes("3. POST /api/ai/session/companion - Schedule Audit")
      );
    } else {
      console.log("\n=== 3. POST /api/ai/session/companion - Schedule Audit ===");
      console.log("Skipped: no companion user found in database.");
    }

    const skills = await Skill.find().limit(5).lean();
    await carePlanController.generateCarePlan(
      {
        user: { id: familyUser._id, _id: familyUser._id },
        body: {
          description:
            "My grandfather has Alzheimer's and needs reminders for medicine, calm supervision, eating help, and light mobility support.",
          availableSkills: skills,
        },
        lang: "en",
        headers: { "accept-language": "en" },
      },
      makeMockRes("4. POST /api/ai/family/generate-care-plan")
    );

    console.log("\nAI endpoint smoke test completed.");
  } catch (error) {
    console.error("AI endpoint smoke test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

runTests();
