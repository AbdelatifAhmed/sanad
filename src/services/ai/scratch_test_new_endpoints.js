const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const connectDB = require("../../config/db");
const familyAgent = require("./agents/familyAgent");
const auditAgent = require("./agents/auditAgent");

async function runTests() {
  console.log("Connecting to database...");
  await connectDB();

  try {
    // 1. Test Care Plan Generation
    console.log("\n=== Testing Care Plan Generation ===");
    const description = "My grandfather suffers from severe Alzheimer's disease. He needs daily cognitive monitoring, help with physical exercises to keep active, and basic assistance in eating and taking his pills.";
    const mockSkills = [
      { _id: "65f12a1a1a1a1a1a1a1a1a1a", nameEn: "Dementia & Alzheimer's Care", nameAr: "رعاية الزهايمر", category: "medical" },
      { _id: "65f12b2b2b2b2b2b2b2b2b2b", nameEn: "Physical Therapy Support", nameAr: "مساعدة العلاج الطبيعي", category: "therapy" },
      { _id: "65f12c3c3c3c3c3c3c3c3c3c", nameEn: "Wound Dressing", nameAr: "غيار الجروح", category: "medical" }
    ];

    const planResult = await familyAgent.generateCarePlan(description, mockSkills, "en");
    console.log("Care Plan Output:", JSON.stringify(planResult, null, 2));

    // 2. Test Batch Auditing Reviews
    console.log("\n=== Testing Batch Reviews Auditing ===");
    const mockReviews = [
      { _id: "65f222222222222222222222", comment: "The helper was very gentle and professional. Highly recommended!", rating: 5 },
      { _id: "65f333333333333333333333", comment: "Alert: The nurse did not show up on time and left my disabled mother unattended. This is gross neglect!", rating: 1 }
    ];

    const auditResult = await auditAgent.batchAuditReviews(mockReviews);
    console.log("Batch Audits Output:", JSON.stringify(auditResult, null, 2));

    // 3. Test Auto Verification of Documents
    console.log("\n=== Testing Auto Document Verification (OCR Alignment) ===");
    const mockCompanionMatched = {
      userId: { name: "Abdellatif Mohamed", phone: "01023456789", email: "abdellatif@example.com" },
      documents: {
        nationalIdCard: { url: "https://cloudinary.com/sanad/national_id_abdellatif.jpg" },
        criminalRecord: { url: "https://cloudinary.com/sanad/criminal_record_abdellatif.jpg" }
      }
    };

    const mockCompanionMismatch = {
      userId: { name: "John Doe", phone: "01523456789", email: "john@example.com" },
      documents: {
        nationalIdCard: { url: "https://cloudinary.com/sanad/national_id_abdellatif.jpg" }, // Mismatching name on ID
        criminalRecord: { url: "https://cloudinary.com/sanad/criminal_record_abdellatif.jpg" }
      }
    };

    const verifyMatched = await auditAgent.autoVerifyDocuments(mockCompanionMatched);
    console.log("Verification of Matched Companion:", JSON.stringify(verifyMatched, null, 2));

    const verifyMismatched = await auditAgent.autoVerifyDocuments(mockCompanionMismatch);
    console.log("Verification of Mismatched Companion:", JSON.stringify(verifyMismatched, null, 2));

  } catch (err) {
    console.error("New features test run error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB.");
  }
}

runTests();
