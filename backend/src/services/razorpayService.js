const Razorpay = require("razorpay");
const crypto = require("crypto");
const { logger } = require("../utils/logger");
const { env } = require("../config/env");

const MODULE_NAME = "Razorpay";

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
    logger.info(MODULE_NAME, `SDK initialized with Test Key: ${env.razorpayKeyId}`);
  } catch (err) {
    logger.warn(MODULE_NAME, `SDK initialization failed`, err);
  }
} else {
  logger.info(MODULE_NAME, "Running in simulated test mode (set real RAZORPAY_KEY_ID in .env anytime)");
}

// Dynamic Merchant Product Catalog by Brand
function getBrandCatalog(brandKeyword = "") {
  const brand = (brandKeyword || "").trim().toLowerCase();

  if (brand.includes("amul")) {
    return [
      {
        id: "prod_amul_protein_pack",
        name: "Amul High-Protein Lassi & Buttermilk Fitness Pack",
        category: "dairy",
        amountPaise: 49900, // ₹499.00
        description: "Fresh high-protein beverages bundle (15g protein per pack)",
        inStock: true,
      },
      {
        id: "prod_amul_gourmet_cheese",
        name: "Amul Gourmet Artisan Cheese & Butter Gift Hamper",
        category: "dairy",
        amountPaise: 89900, // ₹899.00
        description: "Classic salted butter, gouda, diced mozzarella and garlic spread",
        inStock: true,
      },
      {
        id: "prod_amul_icecream_tub",
        name: "Amul Real Ice Cream & Kulfi Celebration Tub",
        category: "desserts",
        amountPaise: 65000, // ₹650.00
        description: "100% real milk ice cream party pack with royal dry fruits",
        inStock: true,
      },
      {
        id: "prod_amul_care_voucher",
        name: "Amul Customer Quality Care & Loyalty Voucher",
        category: "services",
        amountPaise: 29900, // ₹299.00
        description: "Priority resolution voucher redeemable on official Amul stores",
        inStock: true,
      },
    ];
  }

  if (brand.includes("tesla")) {
    return [
      {
        id: "prod_tesla_test_drive",
        name: "Tesla Model 3 / Model Y Priority Test Drive Reservation",
        category: "automotive",
        amountPaise: 250000, // ₹2,500.00
        description: "VIP scheduled test drive experience with product specialist",
        inStock: true,
      },
      {
        id: "prod_tesla_fsd_pass",
        name: "Tesla Full Self-Driving (FSD) Supervised 1-Month Pass",
        category: "software",
        amountPaise: 799900, // ₹7,999.00
        description: "Navigate on Autopilot, Auto Lane Change, Autopark & Smart Summon",
        inStock: true,
      },
      {
        id: "prod_tesla_supercharger",
        name: "Tesla Supercharging Network Credits (500 kWh)",
        category: "charging",
        amountPaise: 199900, // ₹1,999.00
        description: "High-speed Supercharging access across all highway stations",
        inStock: true,
      },
      {
        id: "prod_tesla_service_credit",
        name: "Tesla Mobile Service & Customer Resolution Voucher",
        category: "services",
        amountPaise: 499900, // ₹4,999.00
        description: "Mobile service booking priority and customer satisfaction credit",
        inStock: true,
      },
    ];
  }

  // Dynamic products for any other brand (e.g. Nike, Apple, Zomato, etc.)
  const capBrand = brandKeyword ? (brandKeyword.charAt(0).toUpperCase() + brandKeyword.slice(1)) : "Brand";
  return [
    {
      id: `prod_${brand.replace(/\s+/g, "_") || "item"}_flagship`,
      name: `${capBrand} Premium Product & Experience Package`,
      category: "flagship",
      amountPaise: 249900, // ₹2,499.00
      description: `Official certified ${capBrand} offering with standard manufacturer warranty`,
      inStock: true,
    },
    {
      id: `prod_${brand.replace(/\s+/g, "_") || "item"}_voucher`,
      name: `${capBrand} Customer Retention & Care Resolution Voucher`,
      category: "services",
      amountPaise: 49900, // ₹499.00
      description: `Priority loyalty resolution coupon valid on your next ${capBrand} order`,
      inStock: true,
    },
    {
      id: `prod_${brand.replace(/\s+/g, "_") || "item"}_vip_pass`,
      name: `${capBrand} VIP Annual Pass & Priority Benefits`,
      category: "membership",
      amountPaise: 129900, // ₹1,299.00
      description: `Fast-track customer support, exclusive release drops, and free delivery`,
      inStock: true,
    },
  ];
}

const MERCHANT_CATALOG = getBrandCatalog("generic");

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
  getBrandCatalog,
  createPaymentLink,
  verifyWebhookSignature,
  isRealTestKey,
};
