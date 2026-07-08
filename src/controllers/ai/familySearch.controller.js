const {
  extractFamilySearchQuery,
  searchFamilyCompanions,
} = require("../../services/ai/tools/familySearchTool");

const browseSearch = async (req, res) => {
  try {
    const lang = req.lang || req.headers["accept-language"] || "ar";
    const { query, page = 1, limit = 10 } = req.body;


    if (!query || !String(query).trim()) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "Search query is required" : "جملة البحث مطلوبة",
      });
    }

    const extractedFilters = await extractFamilySearchQuery(String(query), lang);
    const searchResult = await searchFamilyCompanions({
      query: String(query),
      filters: {
        ...extractedFilters,
        intent: "search_companions",
      },
      limit: 100, // Fetch up to 100 candidates for application-layer pagination
    });

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 50));
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;

    // Apply application-layer slice
    const paginatedCompanions = searchResult.companions.slice(startIndex, endIndex);


    return res.status(200).json({
      status: "success",
      results: paginatedCompanions.length,
      pagination: {
        total: searchResult.companions.length,
        pages: Math.ceil(searchResult.companions.length / parsedLimit),
        currentPage: parsedPage,
      },
      data: {
        companions: paginatedCompanions,
        extractedFilters: searchResult.filters,
        nativeFilter: searchResult.companionQuery,
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
