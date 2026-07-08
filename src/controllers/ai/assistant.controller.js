const fs = require('fs');
const path = require('path');
const llm = require('../../config/llm');
const { extractFamilySearchQuery } = require('../../services/ai/tools/familySearchTool');
const AIChatSession = require('../../models/aiChatSession.schema');

// Lazy load platform blueprint document
let sanadInfo = null;
const loadSanadInfo = () => {
  if (sanadInfo) return sanadInfo;
  try {
    const filePath = path.join(__dirname, '../../services/ai/knowledge/sanad_info.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    sanadInfo = JSON.stringify(JSON.parse(rawData)); // Minify it to inject into prompt safely
  } catch (error) {
    console.error("Failed to load sanad_info.json blueprint:", error);
    sanadInfo = "Sanad is a premium companion and caregiver platform. General policies apply.";
  }
  return sanadInfo;
};

// Safe utility to fetch non-sensitive wallet summary (placeholder logic for architecture demonstration)
const getWalletSummary = async (userId) => {
  // In a real app, query Wallet model. 
  // Returning dummy safe representation for now as per mandate.
  return "Balance: 1500 AED. Status: Active.";
};

// Safe utility to fetch schedule summary
const getScheduleSummary = async (userId, role) => {
  // In a real app, query Booking/Schedule models.
  return "Next upcoming appointment is tomorrow at 10:00 AM. No immediate overlaps detected.";
};

const handleChatMessage = async (req, res) => {
  try {
    const { message, role, currentLanguage = 'ar' } = req.body;
    const userId = req.user.id;

    if (!message || !role) {
      return res.status(400).json({
        status: 'fail',
        message: currentLanguage === 'en' ? 'Message and role are required' : 'الرسالة والدور مطلوبان',
      });
    }

    const platformBlueprint = loadSanadInfo();
    const walletSummary = await getWalletSummary(userId);
    const scheduleSummary = await getScheduleSummary(userId, role);

    // 1. If Family User, proactively check if this is a deep search command
    if (role === 'Family') {
      const intentCheck = await extractFamilySearchQuery(message, currentLanguage);
      if (intentCheck && intentCheck.intent === 'search_companions') {
        // Return a Redirection Command Object!
        return res.status(200).json({
          status: 'success',
          data: {
            action: 'REDIRECT_SEARCH',
            reply: currentLanguage === 'en' 
              ? 'I found what you are looking for. Redirecting you to the Browse page now...' 
              : 'لقد فهمت طلبك. سأقوم بتوجيهك إلى صفحة تصفح المرافقين وتطبيق الفلاتر المناسبة...',
            filters: intentCheck,
          }
        });
      }
    }

    // 2. Fetch or create conversational session
    const agentType = role === 'Family' ? 'family_assistant' : 'companion_support';
    let session = await AIChatSession.findOne({ userId, agentType });
    if (!session) {
      session = new AIChatSession({ userId, agentType, messages: [] });
    }

    const normalizedMessages = Array.isArray(session.messages)
      ? session.messages
      : Array.isArray(session.history)
        ? session.history.map((entry) => ({
            sender: entry.role === 'assistant' ? 'ai' : 'user',
            text: entry.content ?? entry.text ?? '',
            timestamps: entry.timestamp ?? entry.timestamps ?? new Date(),
          }))
        : [];

    session.messages = normalizedMessages;

    // Append user message using the schema's message shape
    session.messages.push({ sender: 'user', text: message, timestamps: new Date() });

    // Maintain window size (last 10 turns = 20 messages)
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    const systemPrompt = `You are a premium AI assistant for the Sanad platform. You are currently speaking to a ${role} user.
Current language requested: ${currentLanguage}. Respond exclusively in this language.
You are professional, empathetic, and highly intelligent.

--- SANAD PLATFORM KNOWLEDGE BASE ---
${platformBlueprint}

--- USER CONTEXT SUMMARY ---
Wallet Status: ${walletSummary}
Schedule Summary: ${scheduleSummary}

For Companion users, if you notice anything about schedule overlaps, strongly highlight it using red or bold text to warn them.
Never expose raw database IDs or sensitive credentials. 
Answer concisely and beautifully using markdown.`;

    const messagesForLLM = [
      { role: 'system', content: systemPrompt },
      ...session.messages.map((h) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text || '',
      }))
    ];

    const response = await llm.invoke(messagesForLLM);
    const aiReply = response.content;

    // Append AI reply
    session.messages.push({ sender: 'ai', text: aiReply, timestamps: new Date() });
    await session.save();

    return res.status(200).json({
      status: 'success',
      data: {
        action: 'CHAT_REPLY',
        reply: aiReply,
      }
    });

  } catch (error) {
    console.error("Error in AI Assistant chat controller:", error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  handleChatMessage
};
