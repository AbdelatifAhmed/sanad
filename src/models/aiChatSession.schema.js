const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'], 
    required: true
  },
  text: {
    type: String,
    required: [true, 'message text is required']
  }, timestamps: {
    type: Date,
    default: Date.now
  }
});

const aiChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    agentType: {
      type: String,
      enum: ['family_assistant', 'companion_support'],
      required: true
    },
    messages: [messageSchema]
  },
  { timestamps: true }
);

aiChatSessionSchema.index({ userId: 1, agentType: 1 });

module.exports = mongoose.model('AIChatSession', aiChatSessionSchema);