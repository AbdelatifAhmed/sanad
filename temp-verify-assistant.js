const Module = require('module');
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '../../config/llm') {
    return { invoke: async () => ({ content: 'hello from llm' }) };
  }
  if (request === '../../services/ai/tools/familySearchTool') {
    return { extractFamilySearchQuery: async () => null };
  }
  if (request === '../../models/aiChatSession.schema') {
    class FakeSession {
      constructor(data) { Object.assign(this, data); }
      async save() { return this; }
    }
    FakeSession.findOne = async () => null;
    return FakeSession;
  }
  return originalLoad.apply(this, arguments);
};
const controller = require('./src/controllers/ai/assistant.controller');
(async () => {
  const req = { body: { message: 'hi', role: 'Family', currentLanguage: 'en' }, user: { id: 'user-1' } };
  const res = {
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  await controller.handleChatMessage(req, res);
  console.log(JSON.stringify({ status: res.code, action: res.payload?.data?.action, reply: res.payload?.data?.reply }));
})();
