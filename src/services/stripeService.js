const Stripe = require("stripe");

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16",
});

const createPaymentIntent = async (amount, currency = "egp", metadata = {}) => {
  try {
    const amountInCents = Math.round(amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error("Stripe createPaymentIntent error:", error);
    throw error;
  }
};

const createConnectedAccount = async (email, name) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });
    return account;
  } catch (error) {
    console.error("Stripe createConnectedAccount error:", error);
    throw error;
  }
};

const createAccountOnboardingLink = async (accountId, returnUrl, refreshUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return accountLink.url;
  } catch (error) {
    console.error("Stripe createAccountOnboardingLink error:", error);
    throw error;
  }
};

const releasePayoutToCompanion = async (connectedAccountId, amount, currency = "egp") => {
  try {
    const amountInCents = Math.round(amount * 100);
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      destination: connectedAccountId,
    });
    return transfer;
  } catch (error) {
    console.error("Stripe releasePayoutToCompanion error:", error);
    throw error;
  }
};

const refundCharge = async (paymentIntentId, amount) => {
  try {
    const refundOptions = {
      payment_intent: paymentIntentId,
    };
    if (amount) {
      refundOptions.amount = Math.round(amount * 100);
    }
    const refund = await stripe.refunds.create(refundOptions);
    return refund;
  } catch (error) {
    console.error("Stripe refundCharge error:", error);
    throw error;
  }
};

const createConnectedAccountLoginLink = async (connectedAccountId) => {
  try {
    const loginLink = await stripe.accounts.createLoginLink(connectedAccountId);
    return loginLink.url;
  } catch (error) {
    console.error("Stripe createConnectedAccountLoginLink error:", error);
    throw error;
  }
};

const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

const checkAccountTransfersCapability = async (connectedAccountId) => {
  try {
    const account = await stripe.accounts.retrieve(connectedAccountId);
    const capability = account.capabilities?.transfers;
    const detailsSubmitted = account.details_submitted;
    return {
      isActive: capability === "active",
      capability,
      detailsSubmitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  } catch (error) {
    console.error("Stripe checkAccountTransfersCapability error:", error);
    throw error;
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  createConnectedAccount,
  createAccountOnboardingLink,
  createConnectedAccountLoginLink,
  checkAccountTransfersCapability,
  releasePayoutToCompanion,
  refundCharge,
  verifyWebhookSignature,
};