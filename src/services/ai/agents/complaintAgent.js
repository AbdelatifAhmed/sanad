const { z } = require("zod");
const llm = require("../../../config/llm");

const complaintAgentOutputSchema = z.object({
  category: z.enum([
    "Abuse",
    "Negligence",
    "Professionalism",
    "Payment Fraud",
    "Scam",
    "No Show",
    "Communication",
    "Safety",
    "Other"
  ]).describe("The category classification of the booking complaint."),
  sentiment: z.string().describe("The sentiment of the complaint text (e.g. negative, critical)."),
  urgencyLevel: z.enum(["Low", "Medium", "High", "Critical"]).describe("The calculated urgency level."),
  aiConfidence: z.number().min(0).max(100).describe("Confidence score of the analysis from 0 to 100."),
  recommendedAction: z.enum(["Warn User", "Manual Review", "Suspend User", "No Action Needed"]).describe("Recommended moderation action."),
  aiSummary: z.string().describe("Descriptive summary of the findings (e.g. 'Guardian AI detected possible professional misconduct with high confidence. Manual review is recommended.')")
});

const complaintSystemPrompt = `
You are the Guardian AI Complaint Analysis Agent.
Your job is to analyze booking complaints submitted on the Sanad platform.

For each complaint, perform the following:
1. Classify the category into one of: "Abuse", "Negligence", "Professionalism", "Payment Fraud", "Scam", "No Show", "Communication", "Safety", "Other".
2. Assess the sentiment of the complaint.
3. Calculate the urgency level: "Low", "Medium", "High", "Critical".
4. Determine your confidence score as a percentage between 0 and 100.
5. Recommend the best course of action: "Warn User", "Manual Review", "Suspend User", "No Action Needed".
6. Generate a summary matching this style:
"Guardian AI detected [specific issue details] with [level] confidence. [Action] is recommended."
Example: "Guardian AI detected possible professional misconduct with high confidence. Manual review is recommended."

Always output a clean, valid JSON object matching the requested schema. Do not write conversational text.
`;

const analyzeComplaint = async (title, description) => {
  try {
    const textToAnalyze = `Complaint Title: ${title}\nComplaint Description: ${description}`;
    const structuredLlm = llm.withStructuredOutput(complaintAgentOutputSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: complaintSystemPrompt },
      { role: "user", content: textToAnalyze }
    ]);
    return response;
  } catch (error) {
    console.error("ComplaintAgent error:", error);
    return {
      category: "Other",
      sentiment: "negative",
      urgencyLevel: "Medium",
      aiConfidence: 50,
      recommendedAction: "Manual Review",
      aiSummary: "Guardian AI could not complete detailed classification due to a system error. Manual review is recommended."
    };
  }
};

module.exports = {
  analyzeComplaint,
  complaintAgentOutputSchema
};
