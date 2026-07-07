const fs = require("fs");
const path = require("path");
const { generateEmbedding } = require("./ragService");

// File paths
const familyKnowledgePath = path.join(__dirname, "knowledge", "family_knowledge.json");
const companionKnowledgePath = path.join(__dirname, "knowledge", "companion_knowledge.json");
const dbOutputPath = path.join(__dirname, "knowledge", "local_vector_db.json");

const loadJson = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to load JSON file at ${filePath}:`, error.message);
    return null;
  }
};

const processRoleFile = async (data, role) => {
  const chunks = [];

  if (!data) return chunks;

  // Chunk 1: Core Platform Identity
  const identityText = `Platform: ${data.platformName || "Sanad"}. ${data.whatIsSanad || ""}. Operational Flow: ${data.howItWorks || ""}`;
  console.log(`[RAG Seed] Chunking Identity for ${role}...`);
  try {
    const vector = await generateEmbedding(identityText);
    chunks.push({
      role,
      type: "identity",
      content: {
        platformName: data.platformName,
        whatIsSanad: data.whatIsSanad,
        howItWorks: data.howItWorks
      },
      semanticText: identityText,
      embedding: vector
    });
  } catch (err) {
    console.error(`Error embedding identity for ${role}:`, err.message);
  }

  // Chunk 2: Pages
  if (data.pages && Array.isArray(data.pages)) {
    for (const page of data.pages) {
      const pageText = `Page: ${page.displayName || ""} (${page.route || ""}). Purpose: ${page.purpose || ""}. Features: ${(page.exposedFeatures || []).join(", ")}`;
      console.log(`[RAG Seed] Chunking Page [${page.id || page.displayName}] for ${role}...`);
      try {
        const vector = await generateEmbedding(pageText);
        chunks.push({
          role,
          type: "page",
          content: page,
          semanticText: pageText,
          embedding: vector
        });
      } catch (err) {
        console.error(`Error embedding page ${page.id}:`, err.message);
      }
    }
  }

  // Chunk 3: Questions
  if (data.questions && Array.isArray(data.questions)) {
    for (const qna of data.questions) {
      const keywords = (qna.context_keywords || []).join(" ");
      const questionText = `Question: ${qna.question || ""}. Answer: ${qna.answer || ""}. Context keywords: ${keywords}`;
      console.log(`[RAG Seed] Chunking Question [${qna.id}] for ${role}...`);
      try {
        const vector = await generateEmbedding(questionText);
        chunks.push({
          role,
          type: "question",
          content: qna,
          semanticText: questionText,
          embedding: vector
        });
      } catch (err) {
        console.error(`Error embedding question ${qna.id}:`, err.message);
      }
    }
  }

  return chunks;
};

const runSeeding = async () => {
  console.log("Starting Local RAG Seeding process...");

  const familyData = loadJson(familyKnowledgePath);
  const companionData = loadJson(companionKnowledgePath);

  const familyChunks = await processRoleFile(familyData, "family");
  const companionChunks = await processRoleFile(companionData, "companion");

  const allChunks = [...familyChunks, ...companionChunks];

  try {
    fs.writeFileSync(dbOutputPath, JSON.stringify(allChunks, null, 2), "utf-8");
    console.log(`[RAG Seed SUCCESS] Generated ${allChunks.length} vectors and saved to: ${dbOutputPath}`);
  } catch (err) {
    console.error("Failed to write local vector DB file:", err.message);
  }
};

runSeeding();
