const { ChatOpenAI } = require('@langchain/openai');
require('dotenv').config();

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not defined in .env file');
}

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0.5, 
});

module.exports = llm;