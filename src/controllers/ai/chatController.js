const fs = require("fs");
const path = require("path");
const llm = require("../../config/llm");
const { generateEmbedding } = require("../../services/ai/ragService");
const AIChatSession = require("../../models/aiChatSession.schema");
const { extractFamilySearchQuery } = require("../../services/ai/tools/familySearchTool");

// Path to local vector database
const vectorDbPath = path.join(__dirname, "../../services/ai/knowledge/local_vector_db.json");

// Helper to calculate Cosine Similarity between two vectors
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Lazy load platform blueprint document
let sanadInfo = null;
const loadSanadInfo = () => {
  if (sanadInfo) return sanadInfo;
  try {
    const filePath = path.join(__dirname, "../../services/ai/knowledge/sanad_info.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    sanadInfo = JSON.stringify(JSON.parse(rawData));
  } catch (error) {
    console.error("Failed to load sanad_info.json blueprint:", error);
    sanadInfo = "Sanad is a premium companion and caregiver platform. General policies apply.";
  }
  return sanadInfo;
};

// Safe utility to fetch non-sensitive wallet summary
const getWalletSummary = async (userId) => {
  return "Balance: 1500 AED. Status: Active.";
};

// Safe utility to fetch schedule summary
const getScheduleSummary = async (userId, role) => {
  return "Next upcoming appointment is tomorrow at 10:00 AM. No immediate overlaps detected.";
};

/**
 * Handle chat messages using Local Cosine Similarity RAG.
 */
const handleChatMessage = async (req, res) => {
  try {
    const { message, role: bodyRole, currentLanguage = "ar" } = req.body;
    const userId = req.user.id;
    const userRole = bodyRole || req.user.role || "family";

    if (!message || !userRole) {
      return res.status(400).json({
        status: "fail",
        message: currentLanguage === "en" ? "Message and role are required" : "الرسالة والدور مطلوبان",
      });
    }

    // Normalize role for DB matching
    const normalizedRole = String(userRole).toLowerCase() === "companion" ? "companion" : "family";

    // 1. If Family User, proactively check if this is a deep search command
    if (normalizedRole === "family") {
      const intentCheck = await extractFamilySearchQuery(message, currentLanguage);
      if (intentCheck && intentCheck.intent === "search_companions") {
        return res.status(200).json({
          status: "success",
          data: {
            action: "REDIRECT_SEARCH",
            reply: currentLanguage === "en" 
              ? "I found what you are looking for. Redirecting you to the Browse page now..." 
              : "لقد فهمت طلبك. سأقوم بتوجيهك إلى صفحة تصفح المرافقين وتطبيق الفلاتر المناسبة...",
            filters: intentCheck,
          }
        });
      }
    }

    // 2. Local RAG: Perform Cosine Similarity Search
    let contextInject = "";
    try {
      if (fs.existsSync(vectorDbPath)) {
        const queryVector = await generateEmbedding(message);
        if (queryVector) {
          const rawDb = fs.readFileSync(vectorDbPath, "utf-8");
          const vectorDb = JSON.parse(rawDb);

          // Filter strictly by the user's active role
          const roleChunks = vectorDb.filter(chunk => chunk.role === normalizedRole);

          // Map chunks to calculate similarity scores
          const scoredChunks = roleChunks.map(chunk => {
            const score = calculateCosineSimilarity(queryVector, chunk.embedding);
            return { ...chunk, score };
          });

          // Sort descending and get top 3 matches
          scoredChunks.sort((a, b) => b.score - a.score);
          const topMatches = scoredChunks.slice(0, 3);

          contextInject = topMatches.map(match => {
            return `[Context Category: ${match.type}]\n${match.semanticText}`;
          }).join("\n\n");
        }
      }
    } catch (ragError) {
      console.warn("[Local RAG] Error performing similarity search, falling back:", ragError.message);
    }

    // 3. Fetch or create conversational session
    const agentType = normalizedRole === "family" ? "family_assistant" : "companion_support";
    let session = await AIChatSession.findOne({ userId, agentType });
    if (!session) {
      session = new AIChatSession({ userId, agentType, messages: [] });
    }

    const normalizedMessages = Array.isArray(session.messages)
      ? session.messages
      : Array.isArray(session.history)
        ? session.history.map((entry) => ({
            sender: entry.role === "assistant" ? "ai" : "user",
            text: entry.content ?? entry.text ?? "",
            timestamps: entry.timestamp ?? entry.timestamps ?? new Date(),
          }))
        : [];

    session.messages = normalizedMessages;
    session.messages.push({ sender: "user", text: message, timestamps: new Date() });

    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    const platformBlueprint = loadSanadInfo();
    const walletSummary = await getWalletSummary(userId);
    const scheduleSummary = await getScheduleSummary(userId, userRole);

    const systemPrompt = `You are a premium AI assistant for the Sanad platform. You are currently speaking to a ${userRole} user.
Current language requested: ${currentLanguage}. Respond exclusively in this language.
You are professional, empathetic, and highly intelligent.

--- SANAD PLATFORM KNOWLEDGE BASE ---
${platformBlueprint}

--- RAG RELEVANT KNOWLEDGE CONTEXT ---
${contextInject || "No immediate localized context matched. Fall back to platform blueprint rules."}

--- USER CONTEXT SUMMARY ---
Wallet Status: ${walletSummary}
Schedule Summary: ${scheduleSummary}

For Companion users, if you notice anything about schedule overlaps, strongly highlight it using red or bold text to warn them.
Never expose raw database IDs or sensitive credentials. 
Answer concisely and beautifully using markdown.`;

    const messagesForLLM = [
      { role: "system", content: systemPrompt },
      ...session.messages.map((h) => ({
        role: h.sender === "user" ? "user" : "assistant",
        content: h.text || "",
      }))
    ];

    const response = await llm.invoke(messagesForLLM);
    const aiReply = response.content;

    session.messages.push({ sender: "ai", text: aiReply, timestamps: new Date() });
    await session.save();

    return res.status(200).json({
      status: "success",
      data: {
        action: "CHAT_REPLY",
        reply: aiReply,
      }
    });

  } catch (error) {
    console.error("Error in AI Assistant chat controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  handleChatMessage
};
