const Razorpay = require("razorpay");
const crypto = require("crypto");
const { env } = require("../config/env");

let razorpayClient = null;

const isRealTestKey =
  env.razorpayKeyId &&
  env.razorpayKeyId.startsWith("rzp_test_") &&
  env.razorpayKeyId !== "rzp_test_mock_sentimind" &&
  env.razorpayKeySecret &&
  env.razorpayKeySecret !== "mock_secret_key_12345";

if (isRealTestKey) {
  try {
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
    console.log("💳 Razorpay Node.js SDK initialized with Test Mode Key:", env.razorpayKeyId);
  } catch (err) {
    console.warn("⚠️ Razorpay SDK initialization error:", err.message);
  }
} else {
  console.log("ℹ️ Razorpay running in simulated test mode (set real RAZORPAY_KEY_ID in .env anytime)");
}

// Merchant Product Catalog (Agent-Readable)
const MERCHANT_CATALOG = [
  {
    id: "prod_headphones_pro",
    name: "SentiPulse Wireless Headphones Pro",
    category: "audio",
    amountPaise: 299900, // ₹2,999.00
    description: "Active noise cancelling, 30h ultra-battery life, studio grade acoustic driver",
    inStock: true,
  },
  {
    id: "prod_anc_earbuds",
    name: "SentiPulse True Wireless ANC Earbuds",
    category: "audio",
    amountPaise: 149900, // ₹1,499.00
    description: "IPX5 waterproof, touch gesture control, low-latency gaming mode",
    inStock: true,
  },
  {
    id: "prod_bundle_ultimate",
    name: "Ultimate Audiophile Recovery Bundle (Headphones + Case + Care)",
    category: "bundle",
    amountPaise: 379900, // ₹3,799.00 (discounted from ₹4,499)
    description: "Headphones Pro + Fast charging protective case + 1-Year replacement warranty",
    inStock: true,
  },
  {
    id: "prod_loyalty_pass",
    name: "VIP Brand Loyalty Pass & Extended Care",
    category: "services",
    amountPaise: 49900, // ₹499.00
    description: "Priority customer support, free accessory replacements, exclusive merchandise",
    inStock: true,
  },
];

/**
 * Create a Razorpay Payment Link
 */
async function createPaymentLink({
  amountPaise,
  description,
  customerName,
  customerContact,
  notes = {},
  idempotencyKey,
  forceFail = false,
}) {
  if (forceFail) {
    const error = new Error("Razorpay API Rate Limit Exceeded (429 Too Many Requests)");
    error.statusCode = 429;
    error.code = "RATE_LIMIT_EXCEEDED";
    throw error;
  }

  // If real test key is configured and not simulated
  if (razorpayClient && !env.razorpaySimulationMode) {
    try {
      const payload = {
        amount: Math.round(amountPaise),
        currency: "INR",
        accept_partial: false,
        description: description || "SentiMind Commerce Order",
        customer: {
          name: customerName || "Valued Customer",
          contact: customerContact || undefined,
        },
        notify: {
          sms: false,
          email: false,
        },
        reminder_enable: true,
        notes: {
          ...notes,
          idempotency_key: idempotencyKey || "",
          generated_by: "SentiMind_Agentic_Orchestrator",
        },
        callback_url: "http://localhost:3000/payment-success",
        callback_method: "get",
      };

      const result = await razorpayClient.paymentLink.create(payload);
      return {
        isSimulated: false,
        paymentLinkId: result.id,
        paymentLinkUrl: result.short_url,
        amountPaise: result.amount,
        amountINR: result.amount / 100,
        currency: result.currency,
        notes: result.notes,
      };
    } catch (err) {
      console.error("[RazorpayService] Real API call failed:", err.message);
      // Re-throw with status code for Agent 4 graceful failure handling
      const enhancedErr = new Error(err.message || "Razorpay API error");
      enhancedErr.statusCode = err.statusCode || (err.error && err.error.code === "BAD_REQUEST_ERROR" ? 400 : 500);
      enhancedErr.code = (err.error && err.error.code) || "RAZORPAY_API_ERROR";
      throw enhancedErr;
    }
  }

  // High-fidelity simulation for Test Mode demo
  const mockId = `plink_test_${crypto.randomBytes(6).toString("hex")}`;
  const mockUrl = `https://rzp.io/i/${mockId.replace("plink_test_", "test_")}`;

  return {
    isSimulated: true,
    paymentLinkId: mockId,
    paymentLinkUrl: mockUrl,
    amountPaise: Math.round(amountPaise),
    amountINR: Math.round(amountPaise) / 100,
    currency: "INR",
    notes: {
      ...notes,
      idempotency_key: idempotencyKey || "",
      generated_by: "SentiMind_Agentic_Orchestrator",
    },
  };
}

/**
 * Verify Razorpay Webhook Signature
 */
function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const generated = hmac.digest("hex");
    return generated === signature;
  } catch {
    return false;
  }
}

module.exports = {
  MERCHANT_CATALOG,
  createPaymentLink,
  verifyWebhookSignature,
  isRealTestKey,
};
