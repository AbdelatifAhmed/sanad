const { z } = require("zod");
const Review = require("../../models/reviews.schema");
const Companion = require("../../models/companion.schema");
const ChatMessage = require("../../models/chat.schema");
const auditAgent = require("../../services/ai/agents/auditAgent");
const llm = require("../../config/llm");

/**
 * Audit recent reviews for the Angular Admin dashboard.
 * GET /api/ai/admin/analyze-reviews
 */
const analyzeReviews = async (req, res) => {
  try {
    const lang = req.lang || "ar";
    
    // Fetch last 50 reviews and populate family & companion users
    const reviews = await Review.find()
      .populate("familyId", "name email")
      .populate({
        path: "companionId",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (reviews.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: []
      });
    }

    // Process batch audit using the sub-agent
    const auditedResults = await auditAgent.batchAuditReviews(reviews);

    // Map audit reports back into original reviews data for dashboard convenience
    const payload = reviews.map((rev, index) => {
      const audit = auditedResults[index] || {};
      return {
        ...rev,
        sentimentScore: audit.sentimentScore,
        alertLevel: audit.alertLevel,
        flaggedViolations: audit.flaggedViolations,
        auditSummary: audit.auditSummary
      };
    });

    return res.status(200).json({
      status: "success",
      results: payload.length,
      data: payload
    });

  } catch (error) {
    console.error("Error in analyzeReviews controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

/**
 * Automate caregiver credentials alignment verification.
 * POST /api/ai/admin/auto-verify-docs
 */
const autoVerifyDocs = async (req, res) => {
  try {
    const lang = req.lang || "ar";
    const { companionId } = req.body;

    if (!companionId) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "Companion ID is required" : "معرّف المرافق مطلوب"
      });
    }

    // Fetch companion details and documents
    const companion = await Companion.findById(companionId)
      .populate("userId", "name phone email location");

    if (!companion) {
      return res.status(404).json({
        status: "fail",
        message: lang === "en" ? "Companion profile not found" : "الملف الشخصي للمرافق غير موجود"
      });
    }

    // Invoke automated verification match
    const verificationReport = await auditAgent.autoVerifyDocuments(companion);

    // If verification succeeded automatically, update companion status in DB
    if (verificationReport.status === "verified" || verificationReport.status === "rejected") {
      companion.verificationStatus = verificationReport.status;
      await companion.save();
    }

    return res.status(200).json({
      status: "success",
      data: {
        companionId: companion._id,
        verificationStatus: companion.verificationStatus,
        alignmentCheck: verificationReport
      }
    });

  } catch (error) {
    console.error("Error in autoVerifyDocs controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// ── Fraud / Policy Violation Schema ──────────────────────────────────────────
// Fields like conversationId/userId/userName are omitted by some LLMs —
// we make them optional here and fill them in ourselves from real DB data.

const fraudScanOutputSchema = z.object({
  suspiciousCases: z.array(
    z.object({
      conversationId:  z.string().optional(),
      userId:          z.string().optional(),
      userName:        z.string().optional(),
      conversationType: z.enum(["family_chat", "companion_chat", "admin_chat"]).optional(),
      violationType: z.enum([
        "phone_number_sharing",
        "external_payment_attempt",
        "cash_booking_agreement",
        "contact_information_leakage",
        "suspicious_language",
        "policy_violation",
        "other",
      ]).optional(),
      aiConfidence: z.number().min(0).max(100).optional(),
      riskLevel: z.enum(["high", "medium", "low"]),   // required — always present
      aiExplanation: z.string().optional(),
      suggestedAction: z.string().optional(),
      // LLMs sometimes call this "messages" instead of "flaggedMessages"
      flaggedMessages: z.array(
        z.object({
          sender:     z.string().optional(),
          content:    z.string().optional(),
          text:       z.string().optional(), // alias some LLMs use
          flagReason: z.string().optional(),
        })
      ).optional(),
      messages: z.array(           // alias — normalised below
        z.object({
          sender:  z.string().optional(),
          content: z.string().optional(),
          text:    z.string().optional(),
        })
      ).optional(),
    })
  ).describe("List of detected suspicious conversations. Empty array if none found."),
});

const fraudScanSystemPrompt = `
You are the Sanad AI Fraud & Policy Monitoring Agent.
You analyse recent chat messages between families and companions on the Sanad elderly care platform.

Flag any conversation where you detect:
1. Phone/WhatsApp/external contact sharing (e.g., "my number is 05…", "add me on WhatsApp").
2. Requests to pay outside the app (cash, bank transfer, PayPal).
3. Agreements to arrange services off-platform.
4. Personally identifiable information leakage (address, national ID).
5. Abusive, threatening, or suspicious language.
6. Any other clear policy violation.

For each flagged conversation output a JSON object with these exact keys:
- riskLevel: one of "high", "medium", "low"
- violationType: one of "phone_number_sharing", "external_payment_attempt", "cash_booking_agreement", "contact_information_leakage", "suspicious_language", "policy_violation", "other"
- aiConfidence: integer 50–100
- aiExplanation: short string explaining the flag
- suggestedAction: recommended admin action
- flaggedMessages: array of objects with keys "sender" (string), "content" (string), and optional "flagReason" (string)

Do NOT include any extra keys. If nothing suspicious is found, return { "suspiciousCases": [] }.
`;

/**
 * Scan recent conversations for fraud and policy violations.
 * POST /api/ai/admin/monitor-fraud
 */
const monitorFraud = async (req, res) => {
  try {
    const lang = req.lang || "ar";

    // Fetch the most recent 200 chat messages
    const messages = await ChatMessage.find()
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        status: "success",
        data: {
          scannedAt: new Date().toISOString(),
          totalConversationsScanned: 0,
          violationsDetected: 0,
          highRiskCases: 0,
          suspiciousCases: [],
          analytics: {
            fraudToday: 0,
            fraudThisWeek: 0,
            mostCommonViolation: "—",
            avgConfidence: 0,
            highRiskPercent: 0,
          },
        },
      });
    }

    // Group messages into conversation threads by (senderId, receiverId) pair
    const threadMap = {};
    messages.forEach((msg) => {
      const ids = [String(msg.senderId?._id || msg.senderId), String(msg.receiverId?._id || msg.receiverId)].sort();
      const key = ids.join("_");
      if (!threadMap[key]) {
        threadMap[key] = { key, messages: [] };
      }
      threadMap[key].messages.push(msg);
    });

    const threads = Object.values(threadMap).slice(0, 50); // cap at 50 threads
    const totalConversationsScanned = threads.length;

    // Build a compact text representation of each thread for the LLM
    const conversationText = threads
      .map((thread, i) => {
        const lines = thread.messages
          .slice(0, 10) // limit messages per thread
          .map((m) => {
            const senderName = m.senderId?.name || "Unknown";
            const senderId = String(m.senderId?._id || m.senderId);
            return `[${senderId}|${senderName}]: ${m.messageText}`;
          })
          .join("\n");
        return `--- Conversation #${i + 1} (id:${thread.key}) ---\n${lines}`;
      })
      .join("\n\n");

    // Call LLM with structured output
    const structuredLlm = llm.withStructuredOutput(fraudScanOutputSchema);
    const aiResult = await structuredLlm.invoke([
      { role: "system", content: fraudScanSystemPrompt },
      {
        role: "user",
        content: `Analyse the following ${totalConversationsScanned} conversation thread(s) and flag any violations:\n\n${conversationText}`,
      },
    ]);

    const rawCases = aiResult.suspiciousCases || [];
    const now = new Date().toISOString();
    const todayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const weekCutoff  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Build a lookup so we can resolve user info from thread data
    const threadByIdx = threads;

    // Shape each case to match frontend SuspiciousCase interface.
    // We handle optional fields defensively and support both the
    // "flaggedMessages" and "messages" aliases the LLM may return.
    const suspiciousCases = rawCases.map((c, idx) => {
      // Prefer flaggedMessages, fall back to messages alias
      const rawMsgs = c.flaggedMessages || c.messages || [];

      // Try to derive userId/userName from the thread the LLM referenced.
      // The LLM may not return these, so we pull from the thread that was
      // passed to it (matched by index, best effort).
      const thread = threadByIdx[idx] || threadByIdx[0];
      const firstMsg = thread?.messages?.[0];
      const derivedUserId   = c.userId   || String(firstMsg?.senderId?._id || firstMsg?.senderId || "unknown");
      const derivedUserName = c.userName || firstMsg?.senderId?.name || "Unknown User";

      return {
        id: `fraud-${Date.now()}-${idx}`,
        userId: derivedUserId,
        userName: derivedUserName,
        conversationType: c.conversationType || "family_chat",
        violationType: c.violationType || "other",
        violationLabel: (c.violationType || "other").replace(/_/g, " "),
        aiConfidence: c.aiConfidence ?? 70,
        riskLevel: c.riskLevel || "medium",
        detectedAt: now,
        status: "pending",
        messages: rawMsgs.map((fm) => ({
          sender:    fm.sender  || fm.userName || "Unknown",
          content:   fm.content || fm.text     || "",
          timestamp: now,
          flagged:   true,
          flagReason: fm.flagReason || c.violationType || "policy_violation",
        })),
        aiExplanation:  c.aiExplanation  || "Policy violation detected.",
        suggestedAction: c.suggestedAction || "Review conversation and take appropriate action.",
      };
    });

    // Build analytics
    const highRiskCases = suspiciousCases.filter((c) => c.riskLevel === "high").length;
    const violationCounts = {};
    suspiciousCases.forEach((c) => {
      violationCounts[c.violationType] = (violationCounts[c.violationType] || 0) + 1;
    });
    const mostCommonEntry = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0];
    const mostCommonViolation = mostCommonEntry
      ? mostCommonEntry[0].replace(/_/g, " ")
      : "—";
    const avgConfidence =
      suspiciousCases.length > 0
        ? Math.round(suspiciousCases.reduce((s, c) => s + c.aiConfidence, 0) / suspiciousCases.length)
        : 0;

    return res.status(200).json({
      status: "success",
      data: {
        scannedAt: now,
        totalConversationsScanned,
        violationsDetected: suspiciousCases.length,
        highRiskCases,
        suspiciousCases,
        analytics: {
          fraudToday:            suspiciousCases.filter((c) => c.detectedAt >= todayCutoff).length,
          fraudThisWeek:         suspiciousCases.filter((c) => c.detectedAt >= weekCutoff).length,
          mostCommonViolation,
          avgConfidence,
          highRiskPercent:
            suspiciousCases.length > 0
              ? Math.round((highRiskCases / suspiciousCases.length) * 100)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in monitorFraud controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  analyzeReviews,
  autoVerifyDocs,
  monitorFraud,
};
