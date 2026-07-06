const axios = require('axios');
require("dotenv").config();
const Companion = require('../../models/companion.schema.js'); // الحفاظ على الاستدعاء الأصلي


const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') return null;
  
  const apiKey =  process.env.Ai_API_KEY 
  const url = process.env.EMBEDDING_BASE_URL || 'https://gen.pollinations.ai/v1/embeddings';
  const model = process.env.EMBEDDING_MODEL || 'gemini-2';
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 768);

  const embeddingPayload = {
    model,
    input: text.trim(),
    dimensions,
    encoding_format: 'float',
  };

  if (model.toLowerCase().includes('gemini')) {
    embeddingPayload.task_type = 'RETRIEVAL_QUERY';
  }

  const options = {
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    data: embeddingPayload
  };

  try {
    console.log(`[Embeddings] Requesting vector from ${url} using ${model}...`);

    const response = await axios.request(options);

   
    const vector = response.data?.data?.[0]?.embedding || response.data?.embedding;

    if (!vector || !Array.isArray(vector)) {
      throw new Error(`Invalid schema returned from Pollinations Embeddings. Response: ${JSON.stringify(response.data)}`);
    }

    return vector;

  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Error while generating embedding via Pollinations:', errorMsg);
    throw new Error(`An error occurred while generating the embedding: ${error.message}`);
  }
};

const searchCompanions = async (searchQuery, mongoFilter = {}, limit = 5, postLookupFilter = {}) => {
  try {
    const queryVector = await generateEmbedding(searchQuery);

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',        
          path: 'bioEmbedding',       
          queryVector: queryVector,     
          numCandidates: limit * 20, 
          limit: limit * 2,          
          filter: mongoFilter 
        }
      },
      {
        $lookup: {
          from: 'users',                
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },  
      {
        $match: postLookupFilter
      },
      
      {
        $project: {
          score: { $meta: 'vectorSearchScore' },
          bioEmbedding: 0, 
          'userInfo.passwordHash': 0,
          'userInfo.__v': 0
        }
      },
      {
        $limit: limit
      }
    ];

    const results = await Companion.aggregate(pipeline);
    return results;

  } catch (error) {
    console.error('error while executing vector search:', error.message);
    throw new Error('an error occurred in the smart search engine');
  }
};

module.exports = {
  generateEmbedding,
  searchCompanions
};
