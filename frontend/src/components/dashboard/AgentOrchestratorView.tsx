import { useState, useEffect } from "react";
import {
  Bot,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  DollarSign,
  Layers,
  Activity,
  Copy,
  Lock,
  RefreshCw,
} from "lucide-react";
import * as agentApi from "../../lib/agentApi";

interface Props {
  projectId: number;
}

export function AgentOrchestratorView({ projectId }: Props) {
  const [overview, setOverview] = useState<agentApi.AgentOverviewResponse | null>(null);
  const [signals, setSignals] = useState<agentApi.Signal[]>([]);
  const [campaigns, setCampaigns] = useState<agentApi.Campaign[]>([]);
  const [actions, setActions] = useState<agentApi.AgentAction[]>([]);
  const [catalog, setCatalog] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"campaigns" | "signals" | "actions" | "catalog">("campaigns");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, signalsRes, campaignsRes, actionsRes, catalogRes] = await Promise.all([
        agentApi.getAgentOverview(projectId),
        agentApi.getAgentSignals(projectId),
        agentApi.getAgentCampaigns(projectId),
        agentApi.getAgentActions(projectId),
        agentApi.getAgentCatalog(),
      ]);

      setOverview(overviewRes);
      setSignals(signalsRes.signals || []);
      setCampaigns(campaignsRes.campaigns || []);
      setActions(actionsRes.actions || []);
      setCatalog(catalogRes);
    } catch (err: any) {
      console.error("Failed to load agent orchestrator data:", err);
      setMessage({ type: "error", text: err.message || "Failed to load agent data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleApprove = async (campaignId: string) => {
    try {
      setActionLoading(true);
      const res = await agentApi.approveCampaign(campaignId);
      setMessage({ type: "success", text: res.message });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (campaignId: string) => {
    try {
      setActionLoading(true);
      const res = await agentApi.rejectCampaign(campaignId);
      setMessage({ type: "success", text: res.message });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerDemoSpike = async (spikeType: "negative_spike" | "positive_spike") => {
    try {
      setActionLoading(true);
      const res = await agentApi.triggerTestSpike(projectId, spikeType);
      setMessage({
        type: "success",
        text: `Demo Spike triggered! ${res.stageOutputs?.agent1_signalsDetected} signals, ${res.stageOutputs?.agent2_rootCausesDiagnosed} root causes, and ${res.stageOutputs?.agent3_campaignsPlanned} campaigns planned!`,
      });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerFailureRecovery = async () => {
    try {
      setActionLoading(true);
      const res = await agentApi.triggerFailureRecoveryDemo(projectId);
      setMessage({ type: "success", text: res.message });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPayment = async (actionId: string) => {
    try {
      setActionLoading(true);
      const res = await agentApi.markPaymentConverted(actionId);
      setMessage({ type: "success", text: res.message });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Bot className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">AI Agentic Campaign Orchestrator</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Razorpay UAP Ready
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                4-Agent autonomous loop: <span className="text-indigo-300 font-medium">Detect ➔ Understand ➔ Decide ➔ Approve ➔ Execute ➔ Measure</span>
              </p>
            </div>
          </div>

          {/* Quick Demo Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTriggerDemoSpike("negative_spike")}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Simulate negative sentiment spike on Twitter/Reddit to trigger recovery campaign"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Simulate Negative Spike
            </button>

            <button
              onClick={() => handleTriggerDemoSpike("positive_spike")}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Simulate positive viral surge for growth payment links"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Simulate Viral Surge
            </button>

            <button
              onClick={handleTriggerFailureRecovery}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Demo Razorpay rate-limit failure and idempotent recovery"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Demo Failure Recovery
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100 text-sm">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 4 Agent Pipeline Visualizer Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Step 1: Detect */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stage 1</span>
            <Activity className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="font-semibold text-white text-sm">1. Detect</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sentiment & Signal Agent</div>
          <div className="mt-2 text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md inline-block">
            {overview?.stats?.signalsCount || 0} Spikes Logged
          </div>
        </div>

        {/* Step 2: Understand */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stage 2</span>
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="font-semibold text-white text-sm">2. Understand</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Intent & Root-Cause</div>
          <div className="mt-2 text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md inline-block">
            Gemini NLP Analysis
          </div>
        </div>

        {/* Step 3: Decide */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stage 3</span>
            <Layers className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="font-semibold text-white text-sm">3. Decide</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Campaign Orchestrator</div>
          <div className="mt-2 text-xs font-medium text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md inline-block">
            {campaigns.length} Campaigns
          </div>
        </div>

        {/* Step 4: Approve */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stage 4</span>
            <Lock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="font-semibold text-white text-sm">4. Approve</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Merchant Policy Gate</div>
          <div className="mt-2 text-xs font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block">
            {overview?.stats?.pendingCampaignsCount || 0} In Approval Queue
          </div>
        </div>

        {/* Step 5: Execute */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stage 5</span>
            <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="font-semibold text-white text-sm">5. Execute</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Policy & Payment Agent</div>
          <div className="mt-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">
            {overview?.stats?.totalLinksCreated || 0} Razorpay Links
          </div>
        </div>

        {/* Step 6: Measure */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stage 6</span>
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="font-semibold text-white text-sm">6. Measure</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Loop Closure & ROI</div>
          <div className="mt-2 text-xs font-medium text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md inline-block">
            ₹{overview?.stats?.totalRevenueINR || 0} Revenue Won
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Recovered Revenue</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1">
            ₹{(overview?.stats?.totalRevenueINR || 0).toLocaleString("en-IN")}
            <span className="text-xs font-normal text-slate-400">({overview?.stats?.totalConverted || 0} payments)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Conversion: {overview?.stats?.conversionRate || 0}%</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Autonomous Razorpay Links</div>
          <div className="text-2xl font-bold text-white mt-1">
            {overview?.stats?.totalLinksCreated || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Every money action explainable & gated
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Anti-Abuse Blocked Rate</div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">
            {overview?.stats?.totalBlockedBySafety || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Discount farming & bot attacks neutralized
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Post-Campaign Sentiment Shift</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 flex items-center gap-2">
            {overview?.latestSentimentShift?.positiveChange ? (
              <>
                <span>+{overview.latestSentimentShift.positiveChange}%</span>
                <span className="text-xs font-normal text-rose-400">({overview.latestSentimentShift.negativeChange}%)</span>
              </>
            ) : (
              <span className="text-sm font-normal text-slate-400">Monitoring loop active</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Measured loop closure
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "campaigns"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          Autonomous Campaigns & Approvals
          {overview?.stats?.pendingCampaignsCount ? (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500 text-slate-950 font-bold">
              {overview.stats.pendingCampaignsCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab("signals")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "signals"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="h-4 w-4" />
          Sentiment Spikes & Signals ({signals.length})
        </button>

        <button
          onClick={() => setActiveTab("actions")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "actions"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Live Commerce Audit Trail ({actions.length})
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "catalog"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="h-4 w-4" />
          Agent-Readable Catalog (AI Buyer)
        </button>
      </div>

      {/* TAB 1: Campaigns & Approvals */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <Bot className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No Autonomous Campaigns Yet</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Agent 1 continuously monitors sentiment trends. When a sentiment spike is detected, Agent 2 & 3 will formulate a campaign and place it here.
              </p>
              <button
                onClick={() => handleTriggerDemoSpike("negative_spike")}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                Trigger Demo Negative Spike
              </button>
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp._id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          camp.campaignType === "recovery"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {camp.campaignType}
                      </span>
                      <h3 className="text-lg font-bold text-white">{camp.campaignName}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          camp.status === "pending_approval"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                            : camp.status === "approved" || camp.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : camp.status === "measured"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {camp.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{camp.description}</p>
                  </div>

                  {/* Actions for Pending Approval */}
                  {camp.status === "pending_approval" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(camp._id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(camp._id)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Approve & Execute via Razorpay
                      </button>
                    </div>
                  )}
                </div>

                {/* Planned Actions Grid */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Planned Commercial Remediation (Agent 3 & 4)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {camp.plannedActions?.map((act, i) => (
                      <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{act.product}</span>
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                            {act.discountPercent > 0 ? `${act.discountPercent}% Off Offer` : "Full Price Link"}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">{act.reasoning}</div>
                        <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/50">
                          <span>Target Segment: <strong className="text-slate-200">{act.targetSegment}</strong></span>
                          <span className="font-mono text-emerald-400 font-bold">₹{act.finalAmount / 100}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Measurement Loop Feedback (If Measured) */}
                {camp.measurement && (
                  <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Stage 6: Closed-Loop Sentiment & Revenue Measurement
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-[10px] font-bold">
                        {camp.measurement.roiStatus?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Positive Sentiment</div>
                        <div className="text-emerald-400 font-bold text-sm mt-0.5">
                          {camp.measurement.before?.positivePercent}% ➔ {camp.measurement.after?.positivePercent}%
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Negative Friction</div>
                        <div className="text-rose-400 font-bold text-sm mt-0.5">
                          {camp.measurement.before?.negativePercent}% ➔ {camp.measurement.after?.negativePercent}%
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Links Converted</div>
                        <div className="text-white font-bold text-sm mt-0.5">
                          {camp.measurement.revenueImpact?.totalConverted} / {camp.measurement.revenueImpact?.totalLinksCreated}
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Total Revenue Won</div>
                        <div className="text-emerald-400 font-bold text-sm mt-0.5">
                          ₹{camp.measurement.revenueImpact?.totalRevenueINR}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Signals & Root Causes */}
      {activeTab === "signals" && (
        <div className="space-y-4">
          {signals.map((sig) => (
            <div key={sig._id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      sig.severity === "critical"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : sig.severity === "high"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-indigo-500/20 text-indigo-400"
                    }`}
                  >
                    {sig.severity.toUpperCase()}
                  </span>
                  <h4 className="font-bold text-white text-base">{sig.title}</h4>
                </div>
                <span className="text-xs text-slate-400">{new Date(sig.detectedAt).toLocaleTimeString()}</span>
              </div>

              <p className="text-xs text-slate-300">{sig.description}</p>

              {/* Baseline vs Current */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl text-xs border border-slate-800/80">
                <div>
                  <div className="text-slate-400 font-medium">7-Day Baseline</div>
                  <div className="text-slate-300 mt-1">
                    🟢 {sig.baseline?.positivePercent}% Pos | 🟡 {sig.baseline?.neutralPercent}% Neu | 🔴 {sig.baseline?.negativePercent}% Neg
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Current Anomaly Window</div>
                  <div className="text-slate-300 mt-1">
                    🟢 {sig.current?.positivePercent}% Pos | 🟡 {sig.current?.neutralPercent}% Neu | 🔴 <strong className="text-rose-400">{sig.current?.negativePercent}% Neg</strong>
                  </div>
                </div>
              </div>

              {/* Attached Root Cause (Agent 2) */}
              {sig.rootCauseId && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-semibold text-indigo-300">Agent 2 Root-Cause Diagnosis:</div>
                  <div className="text-slate-300">{sig.rootCauseId.rootCause}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Category: <strong className="text-slate-200">{sig.rootCauseId.category}</strong> | Affected: <strong className="text-slate-200">{sig.rootCauseId.affectedProduct}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Live Commerce Audit Trail */}
      {activeTab === "actions" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Showing verified money actions with idempotency keys & anti-abuse checks</span>
            <span className="font-mono text-emerald-400">Total Count: {actions.length}</span>
          </div>

          {actions.map((act) => (
            <div
              key={act._id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      act.status === "converted"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : act.status === "approved"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : act.status === "failed"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : act.status === "blocked"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {act.status.toUpperCase()}
                  </span>

                  <span className="text-xs text-slate-400">
                    [{act.platform?.toUpperCase()}] @<strong className="text-slate-200">{act.author}</strong>
                  </span>

                  {/* Anti-Abuse Credibility Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                      act.credibilityScore >= 0.7
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : act.credibilityScore >= 0.4
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    Credibility: {act.credibilityScore}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {new Date(act.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Mention Snippet */}
              <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 italic">
                "{act.mentionContent}"
              </div>

              {/* Razorpay Link & Reason */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <div className="text-slate-400">
                  Action: <strong className="text-slate-200">{act.actionReason || act.actionType}</strong>
                </div>

                {act.razorpay?.paymentLinkUrl && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold">₹{act.razorpay.amountINR}</span>
                    <button
                      onClick={() => copyToClipboard(act.razorpay!.paymentLinkUrl!, act._id)}
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded border border-indigo-500/30 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedId === act._id ? "Copied!" : "Copy Link"}
                    </button>

                    {act.status !== "converted" && (
                      <button
                        onClick={() => handleMarkPayment(act._id)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-1 font-semibold"
                        title="Simulate payment confirmation"
                      >
                        <DollarSign className="h-3 w-3" />
                        Simulate Paid
                      </button>
                    )}
                  </div>
                )}

                {/* Graceful Error Display */}
                {act.error && (
                  <div className="text-rose-400 text-[11px] flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {act.error.message} {act.error.willRetry ? "(Scheduled for Idempotent Retry)" : ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Agent-Readable Catalog (AI Buyer Protocol) */}
      {activeTab === "catalog" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Agent-Readable Merchant Catalog (UAP / ACP Standard)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exposes structured JSON endpoints that allow AI buyer agents to discover products and execute conversational checkouts via Razorpay.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono">
              GET /api/agent/catalog
            </span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-indigo-300 border border-slate-800 overflow-x-auto max-h-96">
            {JSON.stringify(catalog, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
