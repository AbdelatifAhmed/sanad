const mongoose = require("mongoose");
const llm = require("../../../config/llm");
const Companion = require("../../../models/companion.schema");
const User = require("../../../models/user.schema");
const { searchCompanions } = require("../ragService");
const { familySearchSchema, getFamilySearchSystemPrompt } = require("../prompts/familySearchPrompt");

const DAY_ALIASES = {
  sunday: "Sunday",
  sun: "Sunday",
  "الأحد": "Sunday",
  "الاحد": "Sunday",
  monday: "Monday",
  mon: "Monday",
  "الإثنين": "Monday",
  "الاثنين": "Monday",
  tuesday: "Tuesday",
  tue: "Tuesday",
  "الثلاثاء": "Tuesday",
  wednesday: "Wednesday",
  wed: "Wednesday",
  "الأربعاء": "Wednesday",
  "الاربعاء": "Wednesday",
  thursday: "Thursday",
  thu: "Thursday",
  "الخميس": "Thursday",
  friday: "Friday",
  fri: "Friday",
  "الجمعة": "Friday",
  saturday: "Saturday",
  sat: "Saturday",
  "السبت": "Saturday",
};

const LOCATION_NORMALIZER = {
  cairo: "القاهرة",
  giza: "الجيزة",
  alexandria: "الإسكندرية",
  qena: "قنا",
  luxor: "الأقصر",
  aswan: "أسوان",
  "nasr city": "مدينة نصر",
  maadi: "المعادي",
  heliopolis: "مصر الجديدة",
};

const normalizeDay = (day) => {
  if (!day) return null;
  const key = String(day).trim().toLowerCase();
  return DAY_ALIASES[key] || DAY_ALIASES[String(day).trim()] || null;
};

const normalizeLocation = (loc) => {
  if (!loc) return undefined;
  const cleaned = String(loc).trim().toLowerCase();
  return LOCATION_NORMALIZER[cleaned] || loc;
};

const inferIntentFromQuery = (query = "") => {
  const text = String(query || "").toLowerCase();
  if (/booking|appointment|schedule|upcoming|calendar|date/i.test(text)) return "calendar";
  if (/price|pricing|payment|escrow|support|policy|service|platform|how|what|can|help/i.test(text)) return "platform_qa";
  if (/find|search|caregiver|companion|nurse|physio|dementia|need|recommend|filter|match|available/i.test(text)) return "search_companions";
  return "general_chat";
};

const normalizeFilters = (raw = {}, fallbackQuery = "") => {
  const days = Array.isArray(raw.days)
    ? [...new Set(raw.days.map(normalizeDay).filter(Boolean))]
    : [];

  return {
    intent: raw.intent || inferIntentFromQuery(fallbackQuery),
    city: normalizeLocation(raw.city),
    governorate: normalizeLocation(raw.governorate),
    preferredGender: raw.preferredGender || undefined,
    maxHourlyRate: raw.maxHourlyRate || raw.maxRate || undefined,
    specialty: raw.specialty || raw.specialization || undefined,
    skills: Array.isArray(raw.skills) ? raw.skills.filter(Boolean) : [],
    days,
    startTime: raw.startTime || undefined,
    endTime: raw.endTime || undefined,
    semanticQuery: raw.semanticQuery || raw.searchQuery || fallbackQuery,
  };
};

const extractFamilySearchQuery = async (query, lang = "ar", history = []) => {
  try {
    const structuredLlm = llm.withStructuredOutput(familySearchSchema);
    const prompt = [
      {
        role: "system",
        content: getFamilySearchSystemPrompt(lang),
      },
      ...history,
      { role: "user", content: query },
    ];

    const response = await structuredLlm.invoke(prompt);
    return normalizeFilters(response, query);
  } catch (error) {
    console.warn("Family search extraction failed; using lightweight fallback heuristics.", error.message);
    return normalizeFilters({ intent: inferIntentFromQuery(query) }, query);
  }
};

const buildNativeFilters = async (filters = {}) => {
  const userQuery = { role: "companion" };
  let hasUserFilters = false;

  if (filters.city) {
    const englishCity = Object.keys(LOCATION_NORMALIZER).find(
      (key) => LOCATION_NORMALIZER[key] === filters.city
    );
    const regexStr = englishCity 
      ? `(${filters.city}|${englishCity})` 
      : filters.city;
    userQuery["location.city"] = { $regex: new RegExp(regexStr, "i") };
    hasUserFilters = true;
  }

  if (filters.governorate) {
    const englishGov = Object.keys(LOCATION_NORMALIZER).find(
      (key) => LOCATION_NORMALIZER[key] === filters.governorate
    );
    const regexStr = englishGov 
      ? `(${filters.governorate}|${englishGov})` 
      : filters.governorate;
    userQuery["location.governorate"] = { $regex: new RegExp(regexStr, "i") };
    hasUserFilters = true;
  }

  if (filters.preferredGender) {
    userQuery.gender = filters.preferredGender;
    hasUserFilters = true;
  }

  const companionQuery = { verificationStatus: "verified" };

  if (filters.maxHourlyRate) {
    companionQuery.hourlyRate = { $lte: Number(filters.maxHourlyRate) };
  }

  if (filters.specialty && filters.specialty !== "none") {
    companionQuery.specialization = filters.specialty;
  }

  if (Array.isArray(filters.days) && filters.days.length > 0) {
    companionQuery.availability = { $elemMatch: { day: { $in: filters.days } } };
  }

  if (hasUserFilters) {
    const matchedUsers = await User.find(userQuery).select("_id").lean();
    companionQuery.userId = { $in: matchedUsers.map((user) => user._id) };
  }

  return companionQuery;
};

const serializeCompanion = (doc) => ({
  _id: doc._id,
  userId: doc.userId || doc.userInfo?._id,
  name: doc.userInfo?.name || doc.userId?.name,
  avatar: doc.userInfo?.avatar?.url || doc.userId?.avatar?.url,
  gender: doc.userInfo?.gender || doc.userId?.gender,
  location: doc.userInfo?.location || doc.userId?.location,
  companionType: doc.companionType,
  specialization: doc.specialization,
  bio: doc.bio,
  hourlyRate: doc.hourlyRate,
  skills: doc.skills,
  hobbies: doc.hobbies,
  availability: doc.availability,
  rating: doc.rating,
  reviewCount: doc.reviewCount,
  score: doc.score,
});

const searchFamilyCompanions = async ({ query, filters, page = 1, limit = 10 }) => {
  const normalizedFilters = normalizeFilters(filters, query);
  const companionQuery = await buildNativeFilters(normalizedFilters);
  
  const totalCount = await Companion.countDocuments(companionQuery);
  const skip = (page - 1) * limit;

  const filteredCompanions = await Companion.find(companionQuery).select("_id").lean();
  const companionIds = filteredCompanions.map((companion) => companion._id);

  if (companionIds.length === 0) {
    return {
      filters: normalizedFilters,
      companionQuery,
      companions: [],
      totalCount: 0,
    };
  }

  const objectIds = companionIds.map((id) => new mongoose.Types.ObjectId(id));
  const semanticText = [
    normalizedFilters.semanticQuery || query,
    normalizedFilters.skills.join(" "),
    normalizedFilters.specialty,
  ].filter(Boolean).join(" ");

  let companions;

  try {
    const topN = await searchCompanions(
      semanticText,
      { _id: { $in: objectIds } },
      skip + limit
    );
    companions = topN.slice(skip, skip + limit);
  } catch (error) {
    console.warn("Vector search failed; falling back to native companion query:", error.message);
    companions = await Companion.find({ _id: { $in: companionIds } })
      .populate({ path: "userId", select: "-passwordHash" })
      .sort({ rating: -1, reviewCount: -1, hourlyRate: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  return {
    filters: normalizedFilters,
    companionQuery,
    totalCount,
    companions: companions.map(serializeCompanion),
  };
};

module.exports = {
  extractFamilySearchQuery,
  searchFamilyCompanions,
  normalizeFilters,
  buildNativeFilters,
};
