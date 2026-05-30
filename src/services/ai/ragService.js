const { OpenAIEmbeddings } = require('@langchain/openai');
const Companion = require('../../models/companion.schema.js'); 

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small', 
});

const generateEmbedding = async (text) => {
  if (!text) return null;
  try {
    const vector = await embeddings.embedQuery(text);
    return vector;
  } catch (error) {
    console.error('error while generating embedding:', error.message);
    throw new Error('an error occurred while generating the embedding');
  }
};


const searchCompanions = async (searchQuery, mongoFilter = {}, limit = 5) => {
  try {
    const queryVector = await generateEmbedding(searchQuery);

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',        
          path: 'bioEmbedding',       
          queryVector: queryVector,     
          numCandidates: limit * 10,   
          limit: limit,
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
        $project: {
          bioEmbedding: 0,             
          'userInfo.password': 0
        }
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