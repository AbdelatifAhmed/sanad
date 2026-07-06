const { z } = require("zod");
const llm = require("../../config/llm");
const SessionManager = require("./sessionManager");
const guardianShieldAgent = require("./agents/guardianShieldAgent");
const auditAgent = require("./agents/auditAgent");
const familyAgent = require("./agents/familyAgent");
const companionAgent = require("./agents/companionAgent");
const sanadKnowledge = require("./knowledge/sanad_info.json");
const {
  extractFamilySearchQuery,
  searchFamilyCompanions,
} = require("./tools/familySearchTool");
const {
  getUpcomingFamilyBookings,
  getCompanionActiveBookings,
  auditCompanionScheduleConflict,
} = require("./tools/calendarTool");

const proposalSchema = z.object({
  wantsScheduleAudit: z.boolean(),
  hasProposalDetails: z.boolean(),
  date: z.string().nullable().optional(),
  day: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  serviceType: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
});

const isArabic = (lang = "ar") => String(lang).toLowerCase().startsWith("ar");

const safeAudit = (userId, userMessage) => {
  auditAgent.auditReview(userId, userMessage).catch((err) => {
    console.error("Audit agent background execution error:", err.message);
  });
};

const generatePlatformAnswer = async ({ userMessage, formattedHistory, lang }) => {
  try {
    const response = await llm.invoke([
      {
        role: "system",
        content: `
You are SANAD's trusted family assistant. Answer only from the provided local knowledge base.
If the answer is not in the knowledge base, say you can help with platform guidance but support should confirm account-specific details.
Keep the answer concise, practical, warm, and in ${isArabic(lang) ? "Arabic" : "English"}.

LOCAL KNOWLEDGE BASE:
${JSON.stringify(sanadKnowledge)}
`,
      },
      ...formattedHistory,
      { role: "user", content: userMessage },
    ]);

    return typeof response.content === "string" ? response.content : String(response.content || "");
  } catch (error) {
    console.warn("Platform QA generation failed; using fallback answer.", error.message);
    return isArabic(lang)
      ? "المساعد غير متاح مؤقتًا، لكن يمكننا مساعدتك لاحقًا أو توجيهك إلى الدعم إذا احتجت إلى تفاصيل حسابية."
      : "The assistant is temporarily unavailable. We can help you again shortly or connect you to support for account-specific details.";
  }
};

const generateCalendarReply = (bookings, lang) => {
  if (bookings.length === 0) {
    return isArabic(lang)
      ? "ليس لديك مواعيد قادمة نشطة حاليا."
      : "You do not have active upcoming bookings right now.";
  }

  const intro = isArabic(lang)
    ? "هذه مواعيدك القادمة:"
    : "Here are your upcoming bookings:";

  const lines = bookings.map((booking, index) => {
    const start = new Date(booking.startDate).toLocaleDateString(isArabic(lang) ? "ar-EG" : "en-US");
    const companion = booking.companion?.name || (isArabic(lang) ? "مرافق غير محدد" : "Companion");
    const days = Array.isArray(booking.workingDays) ? booking.workingDays.join(", ") : "";
    return isArabic(lang)
      ? `${index + 1}. ${start} مع ${companion} - الحالة: ${booking.status}${days ? ` - الأيام: ${days}` : ""}.`
      : `${index + 1}. ${start} with ${companion} - status: ${booking.status}${days ? ` - days: ${days}` : ""}.`;
  });

  return [intro, ...lines].join("\n");
};

const generateSearchReply = (companions, filters, lang) => {
  if (companions.length === 0) {
    return isArabic(lang)
      ? "لم أجد مرافقين مطابقين لهذه الشروط حاليا. يمكننا توسيع السعر أو الأيام أو المنطقة للحصول على نتائج أكثر."
      : "I could not find companions matching these filters right now. We can widen the budget, days, or area to get more results.";
  }

  const intro = isArabic(lang)
    ? `وجدت ${companions.length} مرافقين مناسبين بناء على طلبك:`
    : `I found ${companions.length} suitable companions based on your request:`;

  const lines = companions.slice(0, 5).map((companion, index) => {
    const name = companion.name || (isArabic(lang) ? "مرافق سند" : "SANAD companion");
    const specialty = companion.specialization || "general";
    const rate = companion.hourlyRate ? `${companion.hourlyRate} EGP/hour` : "";
    const rating = companion.rating ? `${companion.rating}/5` : "";
    return `${index + 1}. ${name} - ${specialty}${rate ? ` - ${rate}` : ""}${rating ? ` - ${rating}` : ""}`;
  });

  const filtersLine = isArabic(lang)
    ? `الفلاتر المستخدمة: ${JSON.stringify(filters)}`
    : `Applied filters: ${JSON.stringify(filters)}`;

  return [intro, ...lines, filtersLine].join("\n");
};

const classifyCompanionScheduleIntent = async (userMessage, formattedHistory, lang) => {
  try {
    const structuredLlm = llm.withStructuredOutput(proposalSchema);
    return await structuredLlm.invoke([
      {
        role: "system",
        content: `
Classify whether a SANAD companion is asking about their schedule/workflow or whether they provided a new proposal/request to audit for calendar conflicts.
Extract proposal day/date/startTime/endTime if present. Use HH:MM for times when possible.
Current language: ${lang}.
`,
      },
      ...formattedHistory,
      { role: "user", content: userMessage },
    ]);
  } catch (error) {
    console.warn("Companion schedule classification failed; using fallback state.", error.message);
    return { wantsScheduleAudit: false, hasProposalDetails: false };
  }
};

const handleFamilyAssistant = async ({ userId, userMessage, formattedHistory, lang }) => {
  try {
    const extraction = await extractFamilySearchQuery(userMessage, lang, formattedHistory);

    if (extraction.intent === "calendar") {
      const bookings = await getUpcomingFamilyBookings(userId);
      return {
        responseType: "calendar",
        reply: generateCalendarReply(bookings, lang),
        activeFilters: {},
        results: bookings,
        taskList: [],
      };
    }

    if (extraction.intent === "search_companions") {
      const searchResult = await searchFamilyCompanions({
        query: userMessage,
        filters: extraction,
        limit: 10,
      });

      return {
        responseType: "filtered_data",
        reply: generateSearchReply(searchResult.companions, searchResult.filters, lang),
        activeFilters: searchResult.filters,
        results: searchResult.companions,
        taskList: searchResult.filters.skills || [],
      };
    }

    if (extraction.intent === "platform_qa") {
      const reply = await generatePlatformAnswer({ userMessage, formattedHistory, lang });
      return {
        responseType: "text",
        reply,
        activeFilters: {},
        results: [],
        taskList: [],
      };
    }

    const familyResult = await familyAgent.execute(userMessage, formattedHistory, lang);
    return {
      responseType: "text",
      reply: familyResult.aiReply,
      activeFilters: familyResult.extractedFilters || {},
      results: [],
      taskList: familyResult.taskList || [],
    };
  } catch (error) {
    console.warn("Family assistant execution failed; returning fallback response.", error.message);
    return {
      responseType: "text",
      reply: isArabic(lang)
        ? "عذرًا، لم أتمكن من معالجة طلبك الآن. جرّب سؤالًا أبسط أو حاول مرة أخرى بعد لحظات."
        : "Sorry, I could not process your request right now. Please try a simpler question or try again in a moment.",
      activeFilters: {},
      results: [],
      taskList: [],
    };
  }
};

const handleCompanionAssistant = async ({ userId, userMessage, formattedHistory, lang }) => {
  try {
    const scheduleIntent = await classifyCompanionScheduleIntent(userMessage, formattedHistory, lang);

    if (scheduleIntent.wantsScheduleAudit) {
      if (scheduleIntent.hasProposalDetails) {
        const audit = await auditCompanionScheduleConflict(userId, scheduleIntent);
        return {
          responseType: audit.hasConflict ? "schedule_conflict" : "schedule_ok",
          reply: isArabic(lang) ? audit.messageAr : audit.messageEn,
          activeFilters: scheduleIntent,
          results: audit.activeBookings,
          taskList: [],
        };
      }

      const bookings = await getCompanionActiveBookings(userId);
      const reply = bookings.length === 0
        ? (isArabic(lang) ? "ليس لديك حجوزات نشطة قادمة حاليا." : "You do not have active upcoming bookings right now.")
        : generateCalendarReply(bookings, lang);

      return {
        responseType: "calendar",
        reply,
        activeFilters: {},
        results: bookings,
        taskList: [],
      };
    }

    const companionResult = await companionAgent.execute(userMessage, formattedHistory, lang, userId);
    return {
      responseType: companionResult.responseType,
      reply: companionResult.reply,
      activeFilters: companionResult.activeFilters,
      results: companionResult.results,
      taskList: [],
    };
  } catch (error) {
    console.warn("Companion assistant execution failed; returning fallback response.", error.message);
    return {
      responseType: "text",
      reply: isArabic(lang)
        ? "عذرًا، لم أتمكن من إكمال الطلب الآن. جرّب سؤالًا أبسط أو عد لاحقًا."
        : "Sorry, I could not complete that request right now. Please try a simpler question or try again later.",
      activeFilters: {},
      results: [],
      taskList: [],
    };
  }
};

const orchestrateAiChat = async (userId, userMessage, agentType, lang = "ar") => {
  const formattedHistory = await SessionManager.getFormattedHistory(userId, agentType);

  const safetyResult = await guardianShieldAgent.analyzeMessage(userMessage);
  if (safetyResult.isViolated) {
    const violationWarning = isArabic(lang)
      ? "عذرا، لا يسمح بمشاركة معلومات التواصل الشخصية أو الدفع خارج التطبيق لضمان سلامتكم وحقوقكم."
      : "Security alert: sharing personal contacts or proposing off-platform payments is forbidden to keep your booking protected.";

    await SessionManager.addMessage(userId, agentType, "user", userMessage);
    await SessionManager.addMessage(userId, agentType, "ai", violationWarning);

    return {
      responseType: "text",
      reply: violationWarning,
      activeFilters: {},
      results: [],
      safetyViolation: true,
    };
  }

  const result = agentType === "companion_support"
    ? await handleCompanionAssistant({ userId, userMessage, formattedHistory, lang })
    : await handleFamilyAssistant({ userId, userMessage, formattedHistory, lang });

  await SessionManager.addMessage(userId, agentType, "user", userMessage);
  await SessionManager.addMessage(userId, agentType, "ai", result.reply);
  safeAudit(userId, userMessage);

  return result;
};

module.exports = { orchestrateAiChat };
