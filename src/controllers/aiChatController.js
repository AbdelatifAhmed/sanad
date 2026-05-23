const AIChatSession = require('../models/aiChatSession.schema');

exports.sendMessage = async (req, res) => {
  const { userId, agentType, text } = req.body;
  let session = await AIChatSession.findOne({ userId, agentType });
  if (!session) {
    session = new AIChatSession({ userId, agentType, messages: [] });
  }
  session.messages.push({
    sender: 'user',
    text
  });
  const savedSession = await session.save();
  res.status(200).json(savedSession);
};
