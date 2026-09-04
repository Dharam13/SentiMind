# SentiMind — Business Logic, Problem Statement & Agentic Architecture

---

## 1. Executive Summary & Problem Statement

### 1.1 The Fragmented Social Landscape
In today’s hyper-connected digital ecosystem, brand conversations do not occur in a single, predictable location. Instead, millions of consumer opinions, product reviews, bug complaints, and buying inquiries are scattered unpredictably across diverse platforms:
- **Short-form & Viral Social**: Twitter / X, Reddit, YouTube comments and shorts.
- **Professional & Publishing Networks**: LinkedIn feeds, Medium articles, Substack newsletters.
- **Mainstream Media & Digital Journalism**: Google News, RSS feeds, regional press.

Because these channels operate in isolated silos, modern brand managers and growth marketing teams face a critical challenge: **Information Fragmentation & Decision Latency**.

```
  [Twitter / X]     [Reddit Communities]     [YouTube Reviews]
          \                   |                   /
           \                  |                  /
            ▼                 ▼                 ▼
   =======================================================
   THE VOID: Scattered Mentions, Missed Buying Intent,
             Unanswered Complaints, Information Latency
   =======================================================
            /                 |                  \
           /                  |                   \
          ▼                   ▼                    ▼
   [News Outlets]     [LinkedIn Posts]      [Medium Blogs]
```

### 1.2 The Pain Points of Traditional Brand Monitoring
1. **Scattered Data Without Centralized Conclusions**: Brands utilize disparate tools for Twitter listening, Google alerts, and PR tracking. Data is gathered in CSV files or isolated dashboards without unified sentiment weighting or semantic understanding.
2. **Missing High-Intent Buying Moments**: Consumers frequently post public questions such as *"Where can I order this product online?"* or *"Is there any active discount code for Brand X?"*. By the time a social media manager reads the post 48 hours later, the customer has purchased from a competitor.
3. **Delayed Crisis Response**: A negative batch issue or customer service failure on Reddit can spiral into a brand crisis within 3 hours. Traditional monthly sentiment surveys detect problems long after the damage is irreversible.
4. **Passive Observation Instead of Action**: Almost all existing social listening suites stop at descriptive charts (*"Your sentiment dropped 4%"*). None take active, bounded commercial measures to remediate negative friction or convert positive interest into immediate revenue.

---

## 2. Market Realities & Hard Numeric Facts

Ignoring social media mentions and failing to engage in real time causes catastrophic revenue loss and customer churn across industries:

* **$1.6 Trillion Annual Revenue Loss**: Global enterprises lose over **$1.6 Trillion** every year strictly due to avoidable customer churn and poor response handling (*Accenture Strategy*).
* **73% Defection Rate**: **73% of consumers** state that an unanswered complaint or sluggish customer service response on social media makes them switch directly to a competing brand (*PwC Customer Experience Survey*).
* **Speed to Conversion (The 1-Hour Window)**: Brands that respond to social purchase inquiries within **60 minutes** are **7x more likely** to qualify and close the lead compared to brands responding after 2 hours (*Harvard Business Review*).
* **The Viral Domino Effect**: An unsatisfied consumer shares their negative experience with an average of **16 friends or followers online**, whereas positive reviews reach 9 (*American Express Customer Service Barometer*).
* **Social Commerce Acceleration**: Over **82% of modern consumers** make purchase decisions based directly on recommendations, Reddit threads, and creator reviews (*Sprout Social Index*).

---

## 3. The Centralized Solution: SentiMind

**SentiMind** closes the loop between **listening, deep semantic understanding, and autonomous commercial action**. 

It transforms passive social listening into an active revenue and brand-protection engine by combining:
1. Multi-platform social harvesting across 6+ major networks.
2. Dual-engine sentiment analysis (Transformers + VADER) running on Celery and RabbitMQ.
3. Comprehensive influencer and authority scoring.
4. A 4-Agent Autonomous Commerce Pipeline powered by Google Gemini and live Razorpay checkout links.

---

## 4. Influencer Scoring Engine: "Who is Saying What?"

Not all mentions carry equal weight. A critical tweet from an account with 200,000 active followers has exponentially more impact than a casual mention from a dormant bot.

SentiMind evaluates every collected mention through an **Influencer Composite Scoring Algorithm** (0 to 100):

```
Composite Influencer Score = 
    (Reach Weight × 0.40) + 
    (Engagement Ratio × 0.30) + 
    (Domain/Platform Authority × 0.20) + 
    (Sentiment Extremity × 0.10)
```

### Component Breakdown

| Metric | Source / Methodology | Business Interpretation |
| :--- | :--- | :--- |
| **Reach Proxy** | Follower count (Twitter), Subreddit subscribers (Reddit), Channel subscribers / Video views (YouTube). | Potential impressions and audience footprint of the mention. |
| **Engagement Ratio** | Upvotes, retweets, replies, video likes, and comment velocity. | How actively the community is reacting and amplifying the statement. |
| **Platform Authority** | Smart Domain Authority engine (e.g., TechCrunch = 95, Forbes = 90, Reddit r/all = 85, Medium = 65, Unknown RSS = 40). | Credibility and journalistic weight of the publishing channel. |
| **Sentiment Polarity** | DistilBERT score magnitude ($\|score - 0.5\|$). | High emotional charge (extreme delight or extreme anger) multiplies the score. |

### Tier Classification
* **Tier 1: High-Impact Macro Influencer / Journalist (Score 80–100)**: Immediate alerting required; high risk of viral negative PR or immense viral growth opportunity.
* **Tier 2: Engaged Community Voice / Micro-Influencer (Score 50–79)**: Targeted for direct commercial vouchers, 1-click checkout links, and brand advocacy partnerships.
* **Tier 3: Casual Consumer (Score 0–49)**: Aggregated for baseline sentiment distribution and product trend tracking.

---

## 5. The Three Core Pipeline Stages

```
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: REAL-TIME MULTI-PLATFORM INGESTION                            │
│ Twitter/X API • Reddit OAuth • YouTube Data v3 • Google News • Medium  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: HYBRID SENTIMENT UNDERSTANDING & SPIKE DETECTION              │
│ Python Celery Workers • DistilBERT Transformers • VADER Nuance         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: AUTONOMOUS 4-AGENT ORCHESTRATION & RAZORPAY COMMERCE          │
│ Signal Agent ➔ Root Cause (Gemini) ➔ Campaign Agent ➔ Policy & Razorpay│
└────────────────────────────────────────────────────────────────────────┘
```

---

### STAGE 1: Multi-Platform Collection Across the Internet

The `collector-service` executes continuous, deduplicated harvesting across public social and news APIs:
- **Twitter / X**: Ingests real tweets, quote tweets, and user replies using real-time search filters.
- **Reddit**: Monitors brand subreddits, consumer subreddits (e.g. `r/amulisinstock`, `r/Fitness_India`), and product discussion boards via Reddit's OAuth API.
- **YouTube**: Tracks long-form video descriptions, shorts, and user comments via YouTube Data API v3.
- **Google News & Regional Outlets**: Scans breaking news headlines and digital journals via RSS feeds and NewsAPI.
- **LinkedIn & Medium**: Tracks professional thought-leadership articles and consumer blogs using Smart RSS authority parsing.

**Data Normalization**: Each raw payload is sanitized, stripped of tracking tags, parsed for timestamps (`publishedAt`), mapped to the project, and assigned an idempotency key to eliminate duplicates in MongoDB Atlas.

---

### STAGE 2: Deep Sentiment Understanding & Anomaly Detection

Raw text is queued via **RabbitMQ** into asynchronous **Celery workers** in `sentiment-service`.

#### Dual-Engine Hybrid Model:
1. **Transformer (DistilBERT / RoBERTa)**: Evaluates deep contextual semantics, sarcasm, and sentence structures.
2. **VADER (Valence Aware Dictionary for sEntiment Reasoning)**: Specializes in social media nuances, slang, capitalized emphasis (*"WORST EVER"*), punctuation intensity (*"???"*), and emojis.
3. **Unified Confidence Score**:
   $$\text{Final Score} = (\text{Transformer Score} \times 0.65) + (\text{VADER Score} \times 0.35)$$
   Scores range from `-1.0` (critical negative) to `+1.0` (viral positive).

#### Immediate Business Impact:
- **Negative Spike Warning**: If the percentage of negative mentions surges past 35% or exceeds 1.5x the 7-day baseline within a 6-hour rolling window, an anomaly signal is flagged.
- **Viral Advocacy Surge**: If positive sentiment spikes above 55%, the system immediately recognizes a hot commercial acquisition window.

---

### STAGE 3: Autonomous Agentic Orchestration

When an anomaly signal is flagged, SentiMind activates a **4-Agent Autonomous Pipeline**:

```
[Sentiment Signal] ──► [Agent 1: Signal Detector]
                               │
                               ▼
                       [Agent 2: Root-Cause Diagnosis (Gemini)]
                               │
                               ▼
                       [Agent 3: Campaign Orchestrator]
                               │
                               ▼
                       [Agent 4: Policy, Anti-Abuse & Razorpay Execution]
                               │
                               ▼
                     [Live Razorpay Payment Link Generated]
```

#### Agent 1: Sentiment & Signal Detection Agent
* Evaluates recent conversations against historical baselines.
* Computes deviation factors ($2.4\times$ to $3.5\times$ baseline volume).
* Assembles the evidence set of real mentions triggering the anomaly.

#### Agent 2: Intent & Root-Cause Diagnosis Agent (Powered by Google Gemini)
* Ingests the real text of evidence mentions.
* Extracts the exact underlying reason: *Is it order fulfillment delays? Product taste/packaging? Pricing? App crash?*
* Performs intent classification:
  * `purchase_intent`: User is asking to buy, looking for discounts, or seeking stock.
  * `complaint` / `churn_risk`: User is dissatisfied and threatening to switch to a competitor.
  * `advocacy`: User is publicly praising the brand.

#### Agent 3: Campaign Orchestrator Agent
* Evaluates the brand’s dynamic product catalog (e.g. Amul Protein Buttermilk, Gourmet Cheese Hamper, Tesla Test Drive Reservation).
* Formulates bounded commercial campaigns:
  * **Customer Care Recovery Campaign**: For complaint signals, creates an authorized 15% remediation voucher.
  * **Conversational Growth Surge**: For purchase intent signals, generates an instant 1-click checkout link.
* Calculates budget caps, conversion targets, and expected ROI.

#### Agent 4: Policy, Anti-Abuse & Payment Agent (Live Razorpay Execution)
* **Anti-Abuse Verification**: Analyzes author account credibility (interactive platform, content length, spam/farming history).
* **Policy Guardrails**: Enforces daily transaction caps (max 50 actions/day) and discount limits (max 25%).
* **Razorpay Test API Integration**: Calls Razorpay API to generate live payment links with unique idempotency keys.

---

## 6. Razorpay API Integration & Real-World Scenarios

SentiMind integrates natively with **Razorpay's Payment Links API** (`rzp_test_...`). Every payment link generated is a genuine Razorpay URL (`https://rzp.io/rzp/...`) that can be viewed and tracked on your Razorpay Merchant Dashboard.

```
+-------------------------------------------------------------------------+
|                          RAZORPAY INTEGRATION                           |
|                                                                         |
|  POST https://api.razorpay.com/v1/payment_links                         |
|  Headers: Basic Auth (Key ID: Secret)                                   |
|  Payload:                                                               |
|  {                                                                      |
|    "amount": 76415,          // In paise (₹764.15)                      |
|    "currency": "INR",                                                   |
|    "description": "Amul Quality Recovery Resolution Voucher",          |
|    "customer": { "name": "politicaIanalyst" },                          |
|    "notes": {                                                           |
|      "campaign_id": "camp_6a9a881c9cf",                                 |
|      "source_platform": "reddit",                                       |
|      "generated_by": "SentiMind_Autonomous_Agent"                       |
|    }                                                                    |
|  }                                                                      |
+-------------------------------------------------------------------------+
```

---

### Real-World Example A: Preventing Customer Churn (Negative Friction)

1. **The Real Social Post** (Reddit / Twitter):
   > User `@big_Nero` posts: *"Pretty much lost 900 rupees with Amul order. Customer support didn't reply for 2 days. Never ordering again!"*
2. **Sentiment Analysis**:
   - Polarity: Negative (`final_score: 0.12`, confidence: `0.93`).
3. **Agent 1 & 2 Diagnosis**:
   - Signal: Negative friction spike.
   - Root Cause: Delayed support turnaround and order loss.
   - Intent: `churn_risk` & `complaint`.
4. **Agent 3 Response Plan**:
   - Product: *Amul Gourmet Artisan Cheese & Butter Gift Hamper* (Original ₹899).
   - Strategy: Provide a sincere apology and a 15% remediation voucher (Final ₹764.15).
5. **Agent 4 Execution with Razorpay**:
   - Verifies safety: Platform is interactive, author is not a spam farmer, within budget.
   - Razorpay Call: Generates real payment link `https://rzp.io/rzp/ONH3Fb2r`.
   - Outreach Message:
     > *"Hi @big_Nero, we noticed your feedback regarding your recent Amul order. As an apology and gesture of trust, our team formulated an exclusive 15% resolution voucher: https://rzp.io/rzp/ONH3Fb2r. We'd love for you to give our authentic range another taste!"*
6. **Result**: The churned customer is converted into a retained, loyal customer before defecting to competitors.

---

### Real-World Example B: Direct 1-Click Conversational Checkout (Purchase Intent)

1. **The Real Social Post** (Twitter / YouTube):
   > User `@delhi_foodie` posts: *"Amul butter and high protein lassi are absolute staples in my house! Top tier dairy. Where can I order bulk crates directly online?"*
2. **Sentiment Analysis**:
   - Polarity: Strongly Positive (`final_score: 0.94`, confidence: `0.91`).
3. **Agent 1 & 2 Diagnosis**:
   - Signal: Viral advocacy surge.
   - Root Cause: Organic product delight and bulk purchase interest.
   - Intent: `purchase_intent`.
4. **Agent 3 Response Plan**:
   - Product: *Amul High-Protein Lassi & Buttermilk Fitness Pack* (₹499.00).
   - Strategy: Instant conversational checkout.
5. **Agent 4 Execution with Razorpay**:
   - Razorpay Call: Generates real payment link `https://rzp.io/rzp/5nDnPz1`.
   - Outreach Message:
     > *"Hi @delhi_foodie, thanks for your love for Amul High-Protein Lassi! Here is your direct 1-click checkout link with complimentary priority delivery: https://rzp.io/rzp/5nDnPz1"*
6. **Result**: Zero friction lead conversion. The buyer clicks, pays via UPI/Card in 15 seconds, and revenue is recorded immediately.

---

## 7. Closed-Loop Measurement & ROI Tracking

Unlike traditional tools where campaigns are forgotten once sent, SentiMind automatically closes the measurement loop:

1. **Payment Confirmation**:
   - When the customer completes payment through the Razorpay link, Razorpay sends a signed webhook (`payment_link.paid`).
   - SentiMind verifies the HMAC SHA256 signature and marks the action status as `converted`.
2. **Revenue Attribution**:
   - The verified transaction amount is added to the campaign's total revenue in INR.
   - Real conversion rate is updated:
     $$\text{Conversion Rate} = \left(\frac{\text{Converted Actions}}{\text{Total Links Created}}\right) \times 100$$
3. **Post-Campaign Sentiment Shift**:
   - The system tracks incoming brand mentions 24 to 72 hours following campaign execution.
   - Before vs. After metrics are visualized directly on the executive dashboard:
     - Positive sentiment increase: e.g. $+16\%$ positive shift.
     - Friction reduction: e.g. $-16\%$ negative friction.
     - Verified Return on Investment (ROI): `positive_roi` / `neutral_roi`.

---

## 8. Summary Table: SentiMind Value Proposition

| Traditional Social Listening | SentiMind Autonomous Commerce |
| :--- | :--- |
| Fragmented data across 5 separate tabs. | **Centralized multi-platform ingestion into one unified database.** |
| Passive charts (*"Your sentiment went down 4%"*). | **Active intervention (*"Generated 3 resolution vouchers to save churned buyers"*).** |
| Delayed PR crisis alerts after hours or days. | **Immediate anomaly detection via rolling-window baseline deviations.** |
| Manual outreach taking days to compose. | **AI-generated, brand-tailored outreach with Gemini Flash in seconds.** |
| No revenue attribution. | **Direct 1-click Razorpay payment links with live verified INR revenue tracking.** |
