const Companion = require("../../models/companion.schema");
const User = require("../../models/user.schema");
const familyAgent = require("../../services/ai/agents/familyAgent");
const { searchCompanions } = require("../../services/ai/ragService");
const messages = require("../../utils/messages");

/**
 * Family Smart Hybrid Search Endpoint.
 * Accepts a free-text string, extracts hard filters using AI,
 * queries MongoDB natively first, then applies vector search for ranking.
 *
 * POST /api/ai/family/browse-search
 */
const browseSearch = async (req, res) => {
  try {
    const lang = req.lang || "ar";
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "Search query is required" : "جملة البحث مطلوبة",
      });
    }

    // 1. Use the familyAgent to extract hard filters (city, preferredGender, specialization, etc.)
    const parseResult = await familyAgent.execute(query, [], lang);
    const extracted = parseResult.extractedFilters || {};

    console.log("Extracted Hybrid Search filters:", extracted);

    // 2. Perform native MongoDB filtering first
    const userQuery = { role: "companion" };
    let hasUserFilters = false;

    if (extracted.city) {
      userQuery["location.city"] = { $regex: new RegExp(extracted.city, "i") };
      hasUserFilters = true;
    }
    if (extracted.governorate) {
      userQuery["location.governorate"] = { $regex: new RegExp(extracted.governorate, "i") };
      hasUserFilters = true;
    }
    if (extracted.preferredGender) {
      userQuery["gender"] = extracted.preferredGender;
      hasUserFilters = true;
    }

    let companionQuery = {};

    // Filter by companion specializations or rates natively
    if (extracted.specialization && extracted.specialization !== "none") {
      companionQuery.specialization = extracted.specialization;
    }
    if (extracted.maxRate) {
      companionQuery.hourlyRate = { $lte: extracted.maxRate };
    }

    // If city or gender filters exist, resolve matching user IDs first
    if (hasUserFilters) {
      const matchedUsers = await User.find(userQuery).select("_id").lean();
      const userIds = matchedUsers.map((u) => u._id);
      companionQuery.userId = { $in: userIds };
    }

    // Find all matching companion IDs natively
    const filteredCompanions = await Companion.find(companionQuery).select("_id").lean();
    const companionIds = filteredCompanions.map((c) => c._id);

    // If native filtering returned no results, stop and return empty list
    if (companionIds.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: {
          companions: [],
          extractedFilters: extracted,
        },
      });
    }

    // 3. Apply Atlas Vector Search via 'bioEmbedding' on the filtered subset of companion IDs
    const subsetFilter = { _id: { $in: companionIds } };
    const semanticQueryText = extracted.searchQuery || query;

    const companions = await searchCompanions(
      semanticQueryText,
      subsetFilter,
      10 // Return top 10 ranked caregivers
    );

    return res.status(200).json({
      status: "success",
      results: companions.length,
      data: {
        companions,
        extractedFilters: extracted,
      },
    });
  } catch (error) {
    console.error("Error in browseSearch hybrid controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  browseSearch,
};
