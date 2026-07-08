const llm = require("../../config/llm");
const companionAgent = require("./agents/companionAgent");
const {
  getCompanionActiveBookings,
  auditCompanionScheduleConflict,
  getCompanionProfile,
} = require("./tools/calendarTool");

const isArabic = (lang = "ar") => String(lang).toLowerCase().startsWith("ar");

const generateCalendarReply = (bookings, lang) => {
  if (bookings.length === 0) {
    return isArabic(lang)
      ? "ليس لديك مواعيد نشطة حاليا."
      : "You do not have active bookings right now.";
  }

  const intro = isArabic(lang)
    ? "هذه قائمة مواعيدك وحجوزاتك الحالية:"
    : "Here are your current bookings and schedule:";

  const lines = bookings.map((booking, index) => {
    const start = new Date(booking.startDate).toLocaleDateString(isArabic(lang) ? "ar-EG" : "en-US");
    const personName = booking.family?.name || (isArabic(lang) ? "عائلة غير محددة" : "Family");
    const days = Array.isArray(booking.workingDays) ? booking.workingDays.join(", ") : "";
    
    const now = new Date();
    const startDateObj = new Date(booking.startDate);
    const end = new Date(booking.endDate || booking.startDate);
    
    const isPendingAndPastStart = ["pending", "pending_payment"].includes(booking.status) && startDateObj < now;
    const isActiveAndPastEnd = ["approved", "active"].includes(booking.status) && end < now;
    const isOverdue = isPendingAndPastStart || isActiveAndPastEnd;
    
    let statusText = booking.status;
    let actionLink = "";
    
    if (isOverdue) {
      statusText = isArabic(lang) ? "متأخر (يتطلب إجراء)" : "Overdue (Action Required)";
      actionLink = isArabic(lang) 
        ? ` - [اضغط هنا لإدارة الحجز](/companion/requests)` 
        : ` - [Click here to manage booking](/companion/requests)`;
    } else {
      const statusMapEn = {
        pending: "Pending Approval",
        pending_payment: "Pending Payment",
        approved: "Approved",
        active: "Active",
        completed: "Completed",
        cancelled: "Cancelled"
      };
      const statusMapAr = {
        pending: "في انتظار الموافقة",
        pending_payment: "انتظار الدفع",
        approved: "مقبول",
        active: "نشط",
        completed: "مكتمل",
        cancelled: "ملغي"
      };
      statusText = isArabic(lang) 
        ? (statusMapAr[booking.status] || booking.status) 
        : (statusMapEn[booking.status] || booking.status);
    }

    return isArabic(lang)
      ? `${index + 1}. ${start} مع ${personName} - الحالة: **${statusText}**${days ? ` - الأيام: ${days}` : ""}${actionLink}.`
      : `${index + 1}. ${start} with ${personName} - status: **${statusText}**${days ? ` - days: ${days}` : ""}${actionLink}.`;
  });

  return [intro, ...lines].join("\n");
};

const generatePlatformAnswer = async ({ userMessage, formattedHistory, lang, role = "companion" }) => {
  try {
    const { queryLocalKnowledge } = require("./ragService");
    const ragContext = await queryLocalKnowledge(userMessage, role);

    const response = await llm.invoke([
      {
        role: "system",
        content: `
You are SANAD's trusted assistant. Answer only from the provided local knowledge base.
If the answer is not in the knowledge base, say you can help with platform guidance but support should confirm account-specific details.
Keep the answer concise, practical, warm, and in ${isArabic(lang) ? "Arabic" : "English"}.

CONTEXT FROM KNOWLEDGE BASE:
${ragContext || "No context found."}
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

const companionTools = [
  {
    type: "function",
    function: {
      name: "audit_schedule_conflict",
      description: "Check the companion's current schedule for potential overlaps or conflicts with a proposed new shift proposal.",
      parameters: {
        type: "object",
        properties: {
          date: { 
            type: "string", 
            description: "Proposed date in YYYY-MM-DD format." 
          },
          day: { 
            type: "string", 
            description: "Proposed weekday name in English (e.g. Saturday, Monday)." 
          },
          startTime: { 
            type: "string", 
            description: "Start time of the shift in HH:MM format." 
          },
          endTime: { 
            type: "string", 
            description: "End time of the shift in HH:MM format." 
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_active_bookings",
      description: "Get the companion's own upcoming shifts and active bookings schedule.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

const handleCompanionAssistant = async ({ userId, userMessage, formattedHistory, lang, isAgentActive }) => {
  try {
    const { queryLocalKnowledge } = require("./ragService");
    const ragContext = await queryLocalKnowledge(userMessage, "companion");

    const systemPrompt = `
You are the SANAD Companion Support Agent & Shift Co-Pilot. You advise and guide professional caregivers and nurses on the platform.
Current language: [${lang.toUpperCase()}].

${!isAgentActive ? `
🎯 QUESTION-ONLY MODE ACTIVE:
You are currently restricted from accessing database schedules or auditing conflicts. 
If the user asks you to audit a proposed shift, check for conflicts, or retrieve schedule information, you MUST politely refuse and instruct them to toggle the "Agent" switch in the chat header to enable these actions.
` : `
🎯 AGENT ACTIONS ACTIVE:
You have native shift auditing and schedule tools available. Invoke them when requested.
Whenever the user asks about their schedule or calendar, you MUST invoke the 'get_active_bookings' tool to retrieve the fresh data from the database. Do NOT rely on or repeat bookings listed in the conversation history.
`}

CONTEXT FROM KNOWLEDGE BASE:
${ragContext || "No context found."}
`;

    const promptMessages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: userMessage },
    ];

    const invokeOptions = isAgentActive ? { tools: companionTools } : {};
    let response = await llm.invoke(promptMessages, invokeOptions);
 
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      let toolOutput = "";
      let responseType = "text";
      let results = [];
      let activeFilters = toolCall.args || {};
 
      if (toolCall.name === "audit_schedule_conflict") {
        const profile = await getCompanionProfile(userId);
        if (!profile) {
          return {
            responseType: "text",
            reply: isArabic(lang)
              ? "عذراً، لم أتمكن من العثور على ملفك التعريفي كمرافق."
              : "Sorry, I could not locate your companion profile.",
            activeFilters: {},
            results: [],
            taskList: [],
          };
        }
 
        // FIX: Pass userId (not profile._id) because Booking.companionId references the User model
        const audit = await auditCompanionScheduleConflict(userId, toolCall.args);
        toolOutput = JSON.stringify(audit);
        results = audit.activeBookings || [];
      }
 
      if (toolCall.name === "get_active_bookings") {
        const bookings = await getCompanionActiveBookings(userId);
        toolOutput = JSON.stringify(bookings);
        responseType = "calendar";
        results = bookings;
      }
 
      // Re-invoke the LLM with the tool results so it can write a contextual reply
      const provider = (process.env.DEFAULT_MODEL || "polli").trim().toLowerCase();
      let toolMessages = [];
 
      if (provider === "openai") {
        toolMessages = [
          ...promptMessages,
          {
            role: "assistant",
            content: response.content || "",
            tool_calls: response.tool_calls,
          },
          {
            role: "tool",
            name: toolCall.name,
            tool_call_id: toolCall.id,
            content: toolOutput,
          },
        ];
      } else {
        toolMessages = [
          ...promptMessages,
          {
            role: "assistant",
            content: response.content || `Executing database action: ${toolCall.name}`,
          },
          {
            role: "user",
            content: `[SYSTEM INSTRUCTION: The tool '${toolCall.name}' returned this database data: ${toolOutput}. Please read this data and conversation history, and answer my query directly in the language I used (Arabic or English).]`,
          },
        ];
      }
 
      response = await llm.invoke(toolMessages);
 
      return {
        responseType,
        reply: response.content || "",
        activeFilters,
        results,
        taskList: [],
      };
    }

    if (response.content) {
      const intentCheck = String(userMessage || "").toLowerCase();
      if (/price|pricing|payment|escrow|support|policy|service|platform|how|what|can|help/i.test(intentCheck)) {
        const reply = await generatePlatformAnswer({ userMessage, formattedHistory, lang, role: "companion" });
        return {
          responseType: "text",
          reply,
          activeFilters: {},
          results: [],
          taskList: [],
        };
      }
    }

    return {
      responseType: "text",
      reply: response.content || "",
      activeFilters: {},
      results: [],
      taskList: [],
    };
  } catch (error) {
    console.error("Companion assistant execution error:", error);
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

module.exports = {
  handleCompanionAssistant,
  companionTools,
};
