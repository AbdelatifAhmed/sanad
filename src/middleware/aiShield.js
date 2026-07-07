const { analyzeMessage } = require("../services/ai/agents/guardianShieldAgent");
const { isSuspicious } = require("../utils/regex/chatGuardRegex");
const SecurityAlert = require("../models/securityAlert.schema");

/**
 * Express middleware to sanitize and block prompt injections,
 * communication leakage, and cash-bypassing attempts on AI routes.
 */
const aiShield = async (req, res, next) => {
  try {
    // Extract the input text depending on the route (chat message vs smart search query)
    const inputText = req.body.message || req.body.query || req.body.text || req.body.messageText || "";
    
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

    // 1b. Local Regex-Based Filter Layer to Bypass LLM if Message is Clean
    if (!isSuspicious(inputText)) {
      return next(); // Message is completely safe, pass immediately and bypass LLM!
    }

    // 2. Deep LLM Security Analysis (Guardian Shield)
    const shieldResult = await analyzeMessage(inputText);

    if (shieldResult.isViolated) {
      // Create a security alert in DB for admin audit
      try {
        const alert = await SecurityAlert.create({
          userId: req.user?._id || req.body.userId,
          messageText: inputText,
          reason: shieldResult.reason,
          bookingId: req.body.bookingId || null,
          proposalId: req.body.proposalId || null,
        });

        // Emit real-time socket notification to admin
        if (global.io) {
          global.io.emit("newSecurityAlert", {
            alertId: alert._id,
            userId: req.user?._id,
            userName: req.user?.name || "User",
            messageText: inputText,
            reason: shieldResult.reason,
            createdAt: alert.createdAt,
          });
        }
      } catch (dbErr) {
        console.error("Failed to log security violation in DB:", dbErr);
      }

      return res.status(403).json({
        success: false,
        message: `Message blocked due to policy violation: ${shieldResult.reason}`,
      });
    }

    // 3. Update the request body with the sanitized version (if any redactions occurred)
    if (req.body.message) req.body.message = shieldResult.sanitizedMessage;
    if (req.body.query) req.body.query = shieldResult.sanitizedMessage;
    if (req.body.text) req.body.text = shieldResult.sanitizedMessage;
    if (req.body.messageText) req.body.messageText = shieldResult.sanitizedMessage;

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
