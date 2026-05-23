const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const aiChatSessionSchema = new mongoose.Schema(
{
  userId: { type: ObjectId, ref: 'User' },
  agentType: { type: String, enum: ['family_assistant', 'companion_support'] },
  messages: [
    {
      sender: { type: String, enum: ['user', 'agent'] },
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  updatedAt: Date
})


aiChatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('AIChatSession', aiChatSessionSchema);