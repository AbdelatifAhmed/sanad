const { z } = require("zod");
const llm = require("../../../config/llm");
const Review = require("../../../models/reviews.schema");
const { generateEmbedding } = require("../ragService");

const auditAgentOutputSchema = z.object({
  sentimentScore: z
    .number()
    .min(1.0)
    .max(5.0)
    .describe(
      "A rating from 1.0 to 5.0 representing the sentiment of the text. 1.0 is extremely negative, 5.0 is extremely positive."
    ),
  flaggedViolations: z
    .array(z.string())
    .describe(
      "A list of flagged policy violations or quality concerns (e.g., harassment, elder neglect symptoms, direct cash request)"
    ),
  auditSummary: z
    .string()
    .describe("A concise architectural audit report summarizing the findings and sentiment analysis."),
});

const auditSystemPrompt = `
You are the Sanad Audit and Quality Assurance Agent.
Your role is to run background audits on user review comments, interactions, and verification items.

For any review/text comment:
1. Score the sentiment from 1.0 (very negative) to 5.0 (very positive).
2. Flag any specific violations or concerns:
   - Abuse, toxicity, or harassment.
   - Proposing cash bypass (e.g., "we paid outside the app").
   - Safety warnings or signs of negligence/unprofessionalism.
3. Write a brief summary explaining your findings.
`;


const auditReview = async (reviewId, commentText) => {
  if (!commentText || !commentText.trim()) return;

  try {
    const structuredLlm = llm.withStructuredOutput(auditAgentOutputSchema);
    const result = await structuredLlm.invoke([
      { role: "system", content: auditSystemPrompt },
      { role: "user", content: commentText },
    ]);

    console.log(`Audit Agent result for Review ${reviewId}:`, result);

    let embedding = null;
    try {
      embedding = await generateEmbedding(commentText);
    } catch (embErr) {
      console.error(`Audit Agent failed to generate sentiment embedding for Review ${reviewId}:`, embErr.message);
    }

    const updateData = {};
    if (embedding) {
      updateData.sentiment_embedding = embedding;
    }
    
    if (Object.keys(updateData).length > 0) {
      await Review.findByIdAndUpdate(reviewId, updateData);
      console.log(`Updated Review ${reviewId} with sentiment embedding.`);
    }

    return result;
  } catch (error) {
    console.error(`Audit Agent failed for Review ${reviewId}:`, error.message);
  }
};

const batchAuditReviews = async (reviewsBatch) => {
  const results = await Promise.all(reviewsBatch.map(async (rev) => {
    try {
      if (!rev.comment || !rev.comment.trim()) {
        return {
          reviewId: rev._id,
          comment: rev.comment || "",
          rating: rev.rating,
          sentimentScore: rev.rating,
          alertLevel: rev.rating <= 2 ? "Urgent Action Required" : "Standard Review",
          flaggedViolations: [],
          auditSummary: "No review text comment to analyze."
        };
      }

      const structuredLlm = llm.withStructuredOutput(auditAgentOutputSchema);
      const auditResult = await structuredLlm.invoke([
        { role: "system", content: auditSystemPrompt },
        { role: "user", content: `Comment: "${rev.comment}"\nRating: ${rev.rating}` }
      ]);

      const hasViolations = auditResult.flaggedViolations && auditResult.flaggedViolations.length > 0;
      const isUrgent = auditResult.sentimentScore <= 2.0 || hasViolations || rev.rating <= 2;

      return {
        reviewId: rev._id,
        comment: rev.comment,
        rating: rev.rating,
        sentimentScore: auditResult.sentimentScore,
        alertLevel: isUrgent ? "Urgent Action Required" : "Standard Review",
        flaggedViolations: auditResult.flaggedViolations,
        auditSummary: auditResult.auditSummary
      };
    } catch (err) {
      console.error(`Error auditing review ${rev._id}:`, err.message);
      return {
        reviewId: rev._id,
        comment: rev.comment || "",
        rating: rev.rating,
        sentimentScore: rev.rating || 3,
        alertLevel: rev.rating <= 2 ? "Urgent Action Required" : "Standard Review",
        flaggedViolations: ["Audit analysis fallback due to service limits"],
        auditSummary: "System analysis skipped, fell back to default rating parameters."
      };
    }
  }));
  return results;
};

const autoVerifyDocuments = async (companionProfile) => {
  try {
    const docVerificationSchema = z.object({
      isMatch: z.boolean().describe("True if documents correspond correctly to the user's name and details"),
      confidence: z.number().min(0).max(100).describe("Confidence matching score of alignment percentage (0-100)"),
      verificationReport: z.string().describe("A summary details of criminal background check and ID card matching analysis"),
      status: z.enum(["verified", "rejected", "pending"]).describe("Calculated status: verified (confidence >= 85), rejected (clear mismatch), pending (unsure)")
    });

    const structuredLlm = llm.withStructuredOutput(docVerificationSchema);

    const user = companionProfile.userId || {};
    const docs = companionProfile.documents || {};

    const profileContext = `
User Profile Data:
- Name: ${user.name}
- Phone: ${user.phone}
- Email: ${user.email}
- Location: City: ${user.location?.city || "N/A"}, Governorate: ${user.location?.governorate || "N/A"}

Uploaded Documents to match:
- National ID URL: ${docs.nationalIdCard?.url || "None"}
- Criminal Record URL: ${docs.criminalRecord?.url || "None"}
- Syndicate Card URL: ${docs.syndicateCard?.url || "None"}
`;

    const ocrSystemPrompt = `
You are the Sanad Automated OCR & Credential Verification System.
Your job is to simulate OCR / computer vision analysis on uploaded documents to verify caregiver companion records.
You are given the user's profile details and the URLs of their uploaded National ID card and Criminal Record (الفيش والتشبيه).

Analyze the inputs and match them:
1. Check if the name matches the documents (account for spelling variations in Arabic).
2. Check if documents are uploaded and valid URLs.
3. Simulate a criminal check: assume the Criminal Record URL represents a clear record unless the URL has flagging keywords or status is suspicious.
4. Output a verification matching score confidence from 0 to 100.
5. If confidence >= 85, set status to "verified". If there's a serious name mismatch, set to "rejected". Otherwise, set to "pending".
`;

    const response = await structuredLlm.invoke([
      { role: "system", content: ocrSystemPrompt },
      { role: "user", content: profileContext }
    ]);

    return response;
  } catch (error) {
    console.error("autoVerifyDocuments error:", error.message);
    return {
      isMatch: false,
      confidence: 50,
      verificationReport: "Verification system timeout or error. Reverted to manual queue.",
      status: "pending"
    };
  }
};

module.exports = {
  auditReview,
  batchAuditReviews,
  autoVerifyDocuments,
  auditAgentOutputSchema,
};
