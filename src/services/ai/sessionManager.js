const AIChatSession = require("../../models/aiChatSession.schema");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

class SessionManager {
  static normalizeAgentType(agentType) {
    const aliases = {
      family: "family_assistant",
      family_assistant: "family_assistant",
      companion: "companion_support",
      companion_support: "companion_support",
    };

    return aliases[agentType] || agentType;
  }

  /**
   * Fetch or create a session.
   * @param {string} userId - User's MongoDB ID.
   * @param {string} agentType - Agent Type ('family_assistant' or 'companion_support').
   * @returns {Promise<Document>} The Mongoose Document of AIChatSession.
   */
  static async getSession(userId, agentType) {
    const normalizedAgentType = this.normalizeAgentType(agentType);
    let session = await AIChatSession.findOne({ userId, agentType: normalizedAgentType });
    if (!session) {
      session = new AIChatSession({ userId, agentType: normalizedAgentType, messages: [] });
    }
    return session;
  }

  /**
   * Retrieve and format messages from a user's session history for LangChain.
   * @param {string} userId - User's MongoDB ID.
   * @param {string} agentType - Agent Type.
   * @param {number} limit - Max number of recent messages to fetch.
   * @returns {Promise<Array>} Array of HumanMessage and AIMessage instances.
   */
  static async getFormattedHistory(userId, agentType, limit = 10) {
    const session = await this.getSession(userId, this.normalizeAgentType(agentType));
    const recentMessages = session.messages.slice(-limit);
    return recentMessages.map((msg) => {
      return msg.sender === "user"
        ? new HumanMessage(msg.text)
        : new AIMessage(msg.text);
    });
  }

  /**
   * Add a message to the session history.
   * @param {string} userId - User's MongoDB ID.
   * @param {string} agentType - Agent Type.
   * @param {string} sender - 'user' or 'ai'.
   * @param {string} text - Message text.
   * @returns {Promise<Document>} Saved session document.
   */
  static async addMessage(userId, agentType, sender, text) {
    const schemaSender = sender === "ai" || sender === "assistant" ? "ai" : "user";
    const session = await this.getSession(userId, this.normalizeAgentType(agentType));
    session.messages.push({ sender: schemaSender, text });
    return await session.save();
  }

  /**
   * Clear all messages in the session history.
   * @param {string} userId - User's MongoDB ID.
   * @param {string} agentType - Agent Type.
   * @returns {Promise<Document>} The deleted session document.
   */
  static async clearSession(userId, agentType) {
    return await AIChatSession.findOneAndDelete({
      userId,
      agentType: this.normalizeAgentType(agentType),
    });
  }
}

module.exports = SessionManager;
