const { z } = require("zod");
const llm = require("../../../config/llm");

const guardianShieldOutputSchema = z.object({
  isViolated: z
    .boolean()
    .describe(
      "True if the text contains any communication leakage (phone numbers, emails) or attempts to propose off-platform/cash payment bypasses. False otherwise."
    ),
  reason: z
    .string()
    .describe("Details about why it is a violation, or empty if isViolated is false."),
  sanitizedMessage: z
    .string()
    .describe(
      "The message with any phone numbers, email addresses, or cash-bypassing keywords redacted/masked, or the original message if clean."
    ),
});

const guardianSystemPrompt = `
You are the Guardian Shield Security Agent for the Sanad platform.
Your critical job is to analyze incoming text streams to prevent:
1. Communication Leakage: Phone numbers, emails, WhatsApp links, social media handles, or spelled-out phone digits (e.g., "zero ten...").
2. Cash-Bypassing: Proposing direct payments, paying cash outside the app, bank transfers, deals outside Sanad (e.g., "pay me direct", "offline transaction", "دفع كاش", "خارج التطبيق", "رقمي هو").

If any leakage or bypass is detected:
- Set isViolated to true.
- Provide the reason.
- Sanitize the message by replacing the offending digits/words with "[REDACTED]" in sanitizedMessage.

If the text is clean:
- Set isViolated to false.
- Set reason to "".
- Set sanitizedMessage to the exact input text.
`;

const analyzeMessage = async (messageText) => {
  try {
    const structuredLlm = llm.withStructuredOutput(guardianShieldOutputSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: guardianSystemPrompt },
      { role: "user", content: messageText },
    ]);
    return response;
  } catch (error) {
    console.error("GuardianShieldAgent error:", error);
    return {
      isViolated: false,
      reason: "",
      sanitizedMessage: messageText,
    };
  }
};

module.exports = {
  analyzeMessage,
  guardianShieldOutputSchema,
};
