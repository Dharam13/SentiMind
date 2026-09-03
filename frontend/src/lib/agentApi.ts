const GATEWAY_BASE =
  (import.meta.env.VITE_API_GATEWAY_URL as string) ||
  "http://localhost:8000";

export interface SignalBaseline {
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  avgDailyVolume: number;
  hoursWindow: number;
}

export interface SignalCurrent {
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  mentionCount: number;
  hoursWindow: number;
}

export interface Signal {
  _id: string;
  projectId: number;
  type: "negative_spike" | "positive_spike" | "volume_spike" | "churn_threat" | "viral_advocacy";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  baseline: SignalBaseline;
  current: SignalCurrent;
  deviationFactor: number;
  platforms: string[];
  status: "detected" | "analyzed" | "campaign_planned" | "dismissed";
  detectedAt: string;
  rootCauseId?: RootCause;
  campaignId?: Campaign;
}

export interface IntentBreakdown {
  purchase_intent: number;
  complaint: number;
  comparison: number;
  advocacy: number;
  churn_risk: number;
  irrelevant: number;
}

export interface RootCause {
  _id: string;
  signalId: string;
  projectId: number;
  rootCause: string;
  category: string;
  specificIssue: string;
  affectedProduct: string;
  urgency: "low" | "medium" | "high" | "critical";
  customerSentimentSummary: string;
  intentBreakdown: IntentBreakdown;
  suggestedResponseType: string;
  confidence: number;
  status: "analyzed" | "campaign_created" | "closed";
  createdAt: string;
}

export interface PlannedAction {
  _id?: string;
  targetSegment: string;
  actionType: "payment_link" | "discount_offer" | "bundle_offer" | "support_route";
  product: string;
  originalAmount: number;
  discountPercent: number;
  finalAmount: number;
  estimatedCount: number;
  reasoning: string;
}

export interface CampaignMeasurement {
  measuredAt: string;
  before: {
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    mentionCount: number;
  };
  after: {
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    mentionCount: number;
  };
  sentimentShift: {
    positiveChange: number;
    negativeChange: number;
  };
  revenueImpact: {
    totalLinksCreated: number;
    totalConverted: number;
    conversionRate: number;
    totalRevenuePaise: number;
    totalRevenueINR: number;
  };
  roiStatus: "positive_roi" | "neutral_roi" | "negative_roi" | "evaluating";
  summaryText: string;
}

export interface Campaign {
  _id: string;
  projectId: number;
  signalId?: Signal;
  rootCauseId?: RootCause;
  campaignName: string;
  campaignType: "recovery" | "growth" | "retention" | "celebration" | "direct_checkout";
  description: string;
  targetAudienceDescription: string;
  plannedActions: PlannedAction[];
  totalBudgetEstimate: number;
  expectedRevenue: number;
  expectedConversionRate: number;
  requiresApproval: boolean;
  approvalReason?: string;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "executing" | "active" | "completed" | "measured";
  approvedBy?: string;
  approvedAt?: string;
  actionsTriggered: number;
  actionsSucceeded: number;
  actionsFailed: number;
  actionsBlockedBySafety: number;
  executedAt?: string;
  measurement?: CampaignMeasurement;
  createdAt: string;
}

export interface AgentAction {
  _id: string;
  idempotencyKey: string;
  projectId: number;
  campaignId?: string;
  mentionId: string;
  platform: string;
  author: string;
  mentionContent: string;
  sourceUrl?: string;
  sentimentLabel?: string;
  intentClassification?: string;
  intentReasoning?: string;
  actionType: string;
  actionReason?: string;
  credibilityScore: number;
  credibilityFactors: string[];
  safetyChecks: {
    isActionablePlatform: boolean;
    isDuplicateUser: boolean;
    withinDailyBudget: boolean;
    withinDiscountCap: boolean;
    passedCredibilityGate: boolean;
    requiresHumanApproval: boolean;
  };
  razorpay?: {
    isSimulated: boolean;
    paymentLinkId?: string;
    paymentLinkUrl?: string;
    amountPaise?: number;
    amountINR?: number;
    currency: string;
  };
  status: "executing" | "pending_approval" | "approved" | "sent" | "converted" | "expired" | "rejected" | "failed" | "permanently_failed" | "blocked";
  revenueGeneratedPaise: number;
  convertedAt?: string;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    willRetry: boolean;
    retryCount: number;
    lastRetryAt?: string;
    resolvedGracefully: boolean;
  };
  createdAt: string;
}

export interface AgentOverviewResponse {
  success: boolean;
  stats: {
    signalsCount: number;
    pendingCampaignsCount: number;
    activeCampaignsCount: number;
    totalLinksCreated: number;
    totalConverted: number;
    totalBlockedBySafety: number;
    totalFailed: number;
    totalRevenueINR: number;
    conversionRate: number;
  };
  latestSentimentShift?: {
    positiveChange: number;
    negativeChange: number;
  };
  recentActions: AgentAction[];
  recentCampaigns: Campaign[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GATEWAY_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function getAgentOverview(projectId?: number): Promise<AgentOverviewResponse> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return request<AgentOverviewResponse>(`/api/agent/overview${q}`);
}

export async function getAgentSignals(projectId?: number): Promise<{ success: boolean; signals: Signal[] }> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return request(`/api/agent/signals${q}`);
}

export async function getAgentCampaigns(projectId?: number): Promise<{ success: boolean; campaigns: Campaign[] }> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return request(`/api/agent/campaigns${q}`);
}

export async function getAgentActions(projectId?: number): Promise<{ success: boolean; actions: AgentAction[] }> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return request(`/api/agent/actions${q}`);
}

export async function approveCampaign(campaignId: string, approvedBy: string = "Merchant Admin"): Promise<{ success: boolean; message: string }> {
  return request(`/api/agent/campaigns/${campaignId}/approve`, {
    method: "POST",
    body: JSON.stringify({ approvedBy }),
  });
}

export async function rejectCampaign(campaignId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return request(`/api/agent/campaigns/${campaignId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function triggerTestSpike(projectId: number, spikeType: "negative_spike" | "positive_spike"): Promise<any> {
  return request(`/api/agent/test-spike`, {
    method: "POST",
    body: JSON.stringify({ projectId, spikeType }),
  });
}

export async function triggerFailureRecoveryDemo(projectId: number): Promise<any> {
  return request(`/api/agent/test-failure-recovery`, {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export async function markPaymentConverted(actionId: string): Promise<any> {
  return request(`/api/agent/actions/${actionId}/mark-converted`, {
    method: "POST",
  });
}

export async function getAgentCatalog(): Promise<any> {
  return request(`/api/agent/catalog`);
}
