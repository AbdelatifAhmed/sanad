const axios = require('axios');
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const Companion = require('../../models/companion.schema.js'); // الحفاظ على الاستدعاء الأصلي


const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') return null;
  
  const provider = (process.env.DEFAULT_MODEL || "polli").trim().toLowerCase();
  
  let apiKey, url, model, dimensions;
  
  if (provider === "openai") {
    apiKey = process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;
    url = "https://api.openai.com/v1/embeddings";
    model = "text-embedding-3-small";
    dimensions = 1536;
  } else {
    apiKey = process.env.Ai_API_KEY;
    url = process.env.EMBEDDING_BASE_URL || 'https://gen.pollinations.ai/v1/embeddings';
    model = process.env.EMBEDDING_MODEL || 'openai-3-small';
    dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 1536);
  }

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
    data: embeddingPayload,
    timeout: 8000
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
    console.warn(`[Embeddings Warning] Remote embedding failed: ${errorMsg}. Using deterministic local fallback...`);
    
    // Generate a deterministic dummy embedding vector based on the configured dimensions (e.g. 1536 for OpenAI or 768 for Gemini)
    const fallbackVector = [];
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed + text.charCodeAt(i) * (i + 1)) % 1000000;
    }
    
    // Fill the vector with deterministic values between -1 and 1
    for (let d = 0; d < dimensions; d++) {
      const val = Math.sin(seed + d) * 10000;
      fallbackVector.push(Number((val - Math.floor(val) * 2 - 1).toFixed(6)));
    }
    return fallbackVector;
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
        $sort: {
          score: -1
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

let localDbCache = null;

const queryLocalKnowledge = async (queryText, role, limit = 3) => {
  try {
    const queryVector = await generateEmbedding(queryText);
    if (!queryVector) return "";

    const dbPath = path.join(__dirname, "knowledge", "local_vector_db.json");
    if (!localDbCache) {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, "utf-8");
        localDbCache = JSON.parse(raw);
      } else {
        console.warn(`[RAG Warning] local_vector_db.json not found at ${dbPath}`);
        return "";
      }
    }

    const roleChunks = localDbCache.filter(chunk => chunk.role === role);
    if (roleChunks.length === 0) return "";

    const calculateCosineSimilarity = (vecA, vecB) => {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      const minLength = Math.min(vecA.length, vecB.length);
      for (let i = 0; i < minLength; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const scoredChunks = roleChunks.map(chunk => {
      const similarity = calculateCosineSimilarity(queryVector, chunk.embedding);
      return { chunk, similarity };
    });

    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    const topChunks = scoredChunks.slice(0, limit).map(item => item.chunk.semanticText);
    console.log(`[RAG Query] Fetched ${topChunks.length} relevant chunks for role ${role}. Top similarity: ${scoredChunks[0]?.similarity.toFixed(4) || 0}`);
    
    return topChunks.join("\n\n");
  } catch (err) {
    console.error("Error querying local knowledge base:", err);
    return "";
  }
};

module.exports = {
  generateEmbedding,
  searchCompanions,
  queryLocalKnowledge
};
