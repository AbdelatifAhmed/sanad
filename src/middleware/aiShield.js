const { analyzeMessage } = require("../services/ai/agents/guardianShieldAgent");

/**
 * Express middleware to sanitize and block prompt injections,
 * communication leakage, and cash-bypassing attempts on AI routes.
 */
const aiShield = async (req, res, next) => {
  try {
    // Extract the input text depending on the route (chat message vs smart search query)
    const inputText = req.body.message || req.body.query || req.body.text || "";
    
    if (!inputText || typeof inputText !== "string") {
      return next(); // Nothing to analyze, pass to next middleware/controller
    }

    // 1. Fast Regex Check for Prompt Injection & System Leaks (Fail Fast)
    const promptInjectionRegex = /(ignore all previous instructions|sanad_info|system prompt|internal guidelines|you are now a)/i;
    if (promptInjectionRegex.test(inputText)) {
      return res.status(403).json({
        success: false,
        message: "Your message contains blocked keywords or attempts to bypass system instructions. Please revise your query.",
      });
    }

    // 2. Deep LLM Security Analysis (Guardian Shield)
    const shieldResult = await analyzeMessage(inputText);

    if (shieldResult.isViolated) {
      return res.status(403).json({
        success: false,
        message: `Message blocked due to policy violation: ${shieldResult.reason}`,
      });
    }

    // 3. Update the request body with the sanitized version (if any redactions occurred)
    if (req.body.message) req.body.message = shieldResult.sanitizedMessage;
    if (req.body.query) req.body.query = shieldResult.sanitizedMessage;
    if (req.body.text) req.body.text = shieldResult.sanitizedMessage;

    next();
  } catch (error) {
    console.error("aiShield Middleware Error:", error);
    // In case of middleware error, it's safer to block or fail open depending on policy.
    // Given the critical security, fail closed is better if the LLM fails consistently, 
    // but the guardianShieldAgent already falls back to "not violated" on error.
    next();
  }
};

module.exports = {
  aiShield,
};
