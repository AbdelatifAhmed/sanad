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

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 50));
    
    // We pass page and limit to avoid application-layer slicing.
    // The query parsing (extractFamilySearchQuery) should ideally be cached,
    // but here we just ensure the DB fetch only gets the page requested.
    const extractedFilters = await extractFamilySearchQuery(String(query), lang);
    const searchResult = await searchFamilyCompanions({
      query: String(query),
      filters: {
        ...extractedFilters,
        intent: "search_companions",
      },
      page: parsedPage,
      limit: parsedLimit,
    });

    return res.status(200).json({
      status: "success",
      results: searchResult.companions.length,
      pagination: {
        total: searchResult.totalCount, // The DB total count
        pages: Math.ceil(searchResult.totalCount / parsedLimit),
        currentPage: parsedPage,
      },
      data: {
        companions: searchResult.companions,
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
