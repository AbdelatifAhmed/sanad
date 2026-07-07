const llm = require("../../config/llm");
const familyAgent = require("./agents/familyAgent");
const {
  extractFamilySearchQuery,
  searchFamilyCompanions,
} = require("./tools/familySearchTool");
const {
  getUpcomingFamilyBookings,
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
    const personName = booking.companion?.name || (isArabic(lang) ? "مرافق غير محدد" : "Companion");
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
        ? ` - [اضغط هنا لإدارة الحجز](/family/bookings)` 
        : ` - [Click here to manage booking](/family/bookings)`;
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

const familyTools = [
  {
    type: "function",
    function: {
      name: "search_companions",
      description: "Search and filter verified companions/caregivers based on specialty, city, days, gender, and budget. Use this tool only when the user wants to search, recommend, or filter companions.",
      parameters: {
        type: "object",
        properties: {
          city: { 
            type: "string", 
            description: "Name of the city or neighborhood in Arabic (e.g. القاهرة, الجيزة, المعادي, مدينة نصر). This parameter is REQUIRED." 
          },
          governorate: { 
            type: "string", 
            description: "Name of the governorate in Arabic (e.g. القاهرة, الجيزة)." 
          },
          preferredGender: { 
            type: "string", 
            enum: ["male", "female"],
            description: "Preferred gender if specified."
          },
          maxHourlyRate: { 
            type: "number",
            description: "Maximum hourly rate budget."
          },
          specialty: { 
            type: "string", 
            enum: ["none", "nursing", "physiotherapy", "companionship_companion", "dementia"],
            description: "Required caregiving specialty."
          },
          days: { 
            type: "array", 
            items: { "type": "string" }, 
            description: "Days of availability in English (e.g. Saturday, Monday)." 
          }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_upcoming_bookings",
      description: "Get the family user's own upcoming and active bookings schedule. Use this tool only when they ask about their active bookings or schedule.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_job_post",
      description: "Create a new care request/job post on the platform. Use this tool when the user asks to write a post, publish a request, hire a caregiver, or create a job posting.",
      parameters: {
        type: "object",
        properties: {
          beneficiaryName: { 
            type: "string", 
            description: "Name or relation of the beneficiary (e.g. father, mother, Ali)." 
          },
          city: { 
            type: "string", 
            description: "Arabic name of the city (e.g. القاهرة, الجيزة)." 
          },
          governorate: { 
            type: "string", 
            description: "Arabic name of the governorate (e.g. القاهرة, الجيزة)." 
          },
          budgetPerHour: { 
            type: "number", 
            description: "Proposed hourly rate budget in EGP." 
          },
          serviceType: { 
            type: "string", 
            enum: ["elderly_care", "child_care", "home_nursing", "physical_therapy", "companionship"],
            description: "Service type category needed." 
          },
          workingDays: { 
            type: "array", 
            items: { "type": "string" }, 
            description: "Weekdays required, normalized to English names (e.g. Saturday, Monday)." 
          },
          startTime: { 
            type: "string", 
            description: "Start time of shifts in HH:MM 24-hour format." 
          },
          endTime: { 
            type: "string", 
            description: "End time of shifts in HH:MM 24-hour format." 
          },
          durationInWeeks: { 
            type: "number", 
            description: "Duration of the job posting in weeks." 
          },
          description: { 
            type: "string", 
            description: "Description of the care needed and patient's condition." 
          }
        }
      }
    }
  }
];

const generatePlatformAnswer = async ({ userMessage, formattedHistory, lang, role = "family" }) => {
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

const handleFamilyAssistant = async ({ userId, userMessage, formattedHistory, lang, isAgentActive }) => {
  try {
    const { queryLocalKnowledge } = require("./ragService");
    const ragContext = await queryLocalKnowledge(userMessage, "family");

    const systemPrompt = `
You are the SANAD Family Assistant AI Co-Pilot. You help families find certified healthcare companions and manage their schedules.
Current language: [${lang.toUpperCase()}].

${!isAgentActive ? `
🎯 QUESTION-ONLY MODE ACTIVE:
You are currently restricted from querying the database or running actions. 
If the user asks you to search for caregivers, match companions, or retrieve schedules, you MUST politely refuse and instruct them to toggle the "Agent" switch in the chat header to enable these actions.
` : `
🎯 AGENT ACTIONS ACTIVE:
You have native search and schedule tools available. Invoke them when requested.
Whenever the user asks about their bookings, appointments, schedule, or calendar, you MUST invoke the 'get_upcoming_bookings' tool to retrieve the fresh data from the database. Do NOT rely on or repeat bookings listed in the conversation history.
`}

CONTEXT FROM KNOWLEDGE BASE:
${ragContext || "No context found."}
`;

    const promptMessages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: userMessage }
    ];

    const invokeOptions = isAgentActive ? { tools: familyTools } : {};
    const response = await llm.invoke(promptMessages, invokeOptions);

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];

      if (toolCall.name === "search_companions") {
        const args = toolCall.args || {};
        console.log("[Tool Call: search_companions] Args:", JSON.stringify(args, null, 2));
        
        if (!args.city) {
          console.log("[Tool Call: search_companions] Missing city, asking user.");
          return {
            responseType: "text",
            reply: isArabic(lang)
              ? "يسعدني جداً مساعدتك في البحث عن مرافقي رعاية متميزين! ولكن هل يمكنك إخباري بالمدينة أو الحي المطلوب (مثل: القاهرة، التجمع، المعادي) لنقوم بالتصفية الصحيحة؟"
              : "I would be glad to help you find caregivers! Could you please tell me which city or neighborhood you need them in (e.g. Cairo, Maadi) so I can search correctly?",
            activeFilters: {},
            results: [],
            taskList: [],
          };
        }

        const searchResult = await searchFamilyCompanions({
          query: userMessage,
          filters: args,
          limit: 10,
        });

        console.log("[Tool Call: search_companions] Search Result Count:", searchResult.companions.length);

        return {
          responseType: "filtered_data",
          reply: generateSearchReply(searchResult.companions, searchResult.filters, lang),
          activeFilters: searchResult.filters,
          results: searchResult.companions,
          taskList: searchResult.filters.skills || [],
        };
      }

      if (toolCall.name === "get_upcoming_bookings") {
        const bookings = await getUpcomingFamilyBookings(userId);
        return {
          responseType: "calendar",
          reply: generateCalendarReply(bookings, lang),
          activeFilters: {},
          results: [],
          taskList: [],
        };
      }

      if (toolCall.name === "create_job_post") {
        const args = toolCall.args || {};
        console.log("[Tool Call: create_job_post] Args:", JSON.stringify(args, null, 2));

        const requiredParams = ["beneficiaryName", "city", "budgetPerHour", "serviceType", "workingDays", "startTime", "endTime", "durationInWeeks"];
        const missingParams = requiredParams.filter(param => !args[param] || (Array.isArray(args[param]) && args[param].length === 0));

        if (missingParams.length > 0) {
          const collected = [];
          if (args.beneficiaryName) collected.push(isArabic(lang) ? `المستفيد: ${args.beneficiaryName}` : `care for ${args.beneficiaryName}`);
          if (args.city) collected.push(isArabic(lang) ? `المدينة: ${args.city}` : `in ${args.city}`);
          if (args.budgetPerHour) collected.push(isArabic(lang) ? `الميزانية: ${args.budgetPerHour} ج.م/ساعة` : `budget ${args.budgetPerHour} EGP/hour`);
          
          const collectedText = collected.length > 0
            ? (isArabic(lang) ? `لقد جمعت بعض التفاصيل بالفعل (${collected.join("، ")}). ` : `I have collected some details (${collected.join(", ")}). `)
            : "";

          const questions = [];
          if (missingParams.includes("beneficiaryName")) questions.push(isArabic(lang) ? "من هو المستفيد من الرعاية؟" : "Who is this care for?");
          if (missingParams.includes("city")) questions.push(isArabic(lang) ? "ما هي المدينة أو المنطقة؟" : "Which city or neighborhood?");
          if (missingParams.includes("budgetPerHour")) questions.push(isArabic(lang) ? "ما هو سعر الساعة المقترح؟" : "What is your hourly budget?");
          if (missingParams.includes("serviceType")) questions.push(isArabic(lang) ? "ما هو نوع الخدمة (مثل: رعاية مسنين، تمريض منزلي، علاج طبيعي)؟" : "What category of service (e.g. elderly care, home nursing, physical therapy)?");
          if (missingParams.includes("workingDays")) questions.push(isArabic(lang) ? "ما هي أيام العمل المطلوبة في الأسبوع؟" : "Which days of the week are needed?");
          if (missingParams.includes("startTime") || missingParams.includes("endTime")) questions.push(isArabic(lang) ? "ما هي أوقات بدء وانتهاء العمل؟" : "What are the start and end times?");
          if (missingParams.includes("durationInWeeks")) questions.push(isArabic(lang) ? "ما هي مدة الخدمة المطلوبة بالأسابيع؟" : "For how many weeks do you need this service?");

          return {
            responseType: "text",
            reply: collectedText + (isArabic(lang)
              ? `لمتابعة إنشاء الطلب، يرجى تزويدي بالمعلومات التالية:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
              : `To complete the job post, please provide the remaining details:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`),
            activeFilters: {},
            results: [],
            taskList: [],
          };
        }

        try {
          const Family = require("../../models/family.schema");
          const User = require("../../models/user.schema");
          const JobPost = require("../../models/jobPost.schema");

          const familyProfile = await Family.findOne({ familyId: userId });
          if (!familyProfile || !familyProfile.beneficiaries || familyProfile.beneficiaries.length === 0) {
            return {
              responseType: "text",
              reply: isArabic(lang)
                ? "عذراً، لم أجد أي مستفيدين مسجلين في حسابك. يرجى إضافة مستفيد (مثل والدك أو والدتك) من صفحة الملف الشخصي أولاً لتتمكن من إنشاء طلب."
                : "Sorry, I could not find any beneficiaries registered on your profile. Please add a family member under your profile first to create a care request.",
              activeFilters: {},
              results: [],
              taskList: [],
            };
          }

          let beneficiary = familyProfile.beneficiaries.find(b => 
            b.name.toLowerCase().includes(args.beneficiaryName.toLowerCase()) ||
            (args.beneficiaryName.toLowerCase() === "father" && b.gender === "male") ||
            (args.beneficiaryName.toLowerCase() === "mother" && b.gender === "female")
          );

          if (!beneficiary) {
            beneficiary = familyProfile.beneficiaries[0];
          }

          const user = await User.findById(userId);
          const coordinates = user?.location?.geo?.coordinates || [31.2357, 30.0444];

          const newPost = await JobPost.create({
            familyId: userId,
            beneficiaryId: beneficiary._id,
            title: isArabic(lang) ? `طلب رعاية لـ ${beneficiary.name}` : `Care request for ${beneficiary.name}`,
            description: args.description || (isArabic(lang) 
              ? `طلب رعاية لـ ${beneficiary.name} في ${args.city} بميزانية ${args.budgetPerHour} ج.م/ساعة.` 
              : `Care request for ${beneficiary.name} in ${args.city} with a budget of ${args.budgetPerHour} EGP/hour.`),
            serviceType: args.serviceType,
            budgetPerHour: Number(args.budgetPerHour),
            schedule: {
              workingDays: args.workingDays,
              startTime: args.startTime,
              endTime: args.endTime,
              durationInWeeks: Number(args.durationInWeeks)
            },
            location: {
              geo: { type: "Point", coordinates },
              city: args.city,
              governorate: args.governorate || args.city
            },
            startDate: new Date(),
            status: "open"
          });

          return {
            responseType: "text",
            reply: isArabic(lang)
              ? `🎉 تم بنجاح إنشاء طلب الرعاية الخاص بك لـ **${beneficiary.name}** في **${args.city}** بميزانية **${args.budgetPerHour} ج.م/ساعة**! يمكنك مراجعته والتقديم عليه من [صفحة طلباتي](/family/job-posts).`
              : `🎉 Successfully created your care request for **${beneficiary.name}** in **${args.city}** with a budget of **${args.budgetPerHour} EGP/hour**! You can manage it on your [My Posts page](/family/job-posts).`,
            activeFilters: {},
            results: [],
            taskList: [],
          };

        } catch (dbError) {
          console.error("Failed to create job post in DB:", dbError);
          throw dbError;
        }
      }
    }

    if (response.content) {
      // Run fallback platform QA if user message maps semantically to platform FAQs/features
      const intentCheck = String(userMessage || "").toLowerCase();
      if (/price|pricing|payment|escrow|support|policy|service|platform|how|what|can|help/i.test(intentCheck)) {
        const reply = await generatePlatformAnswer({ userMessage, formattedHistory, lang, role: "family" });
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
    console.error("Family assistant execution error:", error);
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

module.exports = {
  handleFamilyAssistant,
  familyTools,
};
