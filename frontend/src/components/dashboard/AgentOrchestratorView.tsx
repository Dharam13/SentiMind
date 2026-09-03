import { useState, useEffect } from "react";
import {
  Bot,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Layers,
  Activity,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Eye,
  Search,
  CheckCircle2,
  ArrowRight,
  Shield,
  BarChart3,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import * as agentApi from "../../lib/agentApi";

interface Props {
  projectId: number;
  keyword?: string;
}

/* ──────────────────────────── helpers ──────────────────────────── */

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    executing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    measured: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    completed: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    draft: "bg-slate-600/20 text-slate-400 border-slate-600/30",
    converted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    permanently_failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    blocked: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return map[status] || "bg-slate-600/20 text-slate-400 border-slate-600/30";
}

function severityColor(severity: string) {
  const map: Record<string, string> = {
    critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    medium: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    low: "bg-slate-600/20 text-slate-400 border-slate-600/30",
  };
  return map[severity] || "bg-slate-600/20 text-slate-400 border-slate-600/30";
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLabel(s: string) {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ──────────────────── Pipeline Step Component ──────────────────── */

function PipelineStep({
  icon: Icon,
  label,
  value,
  color,
  isLast,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-0 flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center border ${color} backdrop-blur-sm transition-all hover:scale-105`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="text-[11px] font-semibold text-slate-300 text-center leading-tight">
          {label}
        </span>
        <span className="text-[10px] font-mono text-slate-500">{value}</span>
      </div>
      {!isLast && (
        <div className="flex-1 flex items-center justify-center -mt-6 px-1">
          <div className="h-[2px] w-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-indigo-500/40 animate-pulse" />
          </div>
          <ArrowRight className="h-3 w-3 text-slate-600 -ml-1 -mt-0 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Main Component ──────────────────── */

export function AgentOrchestratorView({ projectId, keyword }: Props) {
  const [overview, setOverview] = useState<agentApi.AgentOverviewResponse | null>(null);
  const [signals, setSignals] = useState<agentApi.Signal[]>([]);
  const [campaigns, setCampaigns] = useState<agentApi.Campaign[]>([]);
  const [actions, setActions] = useState<agentApi.AgentAction[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"campaigns" | "signals" | "actions">("campaigns");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [showSimMenu, setShowSimMenu] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, signalsRes, campaignsRes, actionsRes] = await Promise.all([
        agentApi.getAgentOverview(projectId),
        agentApi.getAgentSignals(projectId),
        agentApi.getAgentCampaigns(projectId),
        agentApi.getAgentActions(projectId),
      ]);

      setOverview(overviewRes);
      setSignals(signalsRes.signals || []);
      setCampaigns(campaignsRes.campaigns || []);
      setActions(actionsRes.actions || []);
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
      setShowSimMenu(false);
      const res = await agentApi.triggerTestSpike(projectId, spikeType, keyword);
      setMessage({
        type: "success",
        text: `Simulation complete — ${res.stageOutputs?.agent1_signalsDetected || 0} signals, ${res.stageOutputs?.agent3_campaignsPlanned || 0} campaigns created`,
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
      setShowSimMenu(false);
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

  /* ────────────────────────── RENDER ────────────────────────── */

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-violet-950/40 p-5 backdrop-blur-md">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-violet-500/8 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                AI Agent Pipeline
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Autonomous sentiment monitoring, campaign planning & response execution
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSimMenu(!showSimMenu)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                Simulate
                <ChevronDown className={`h-3 w-3 transition-transform ${showSimMenu ? "rotate-180" : ""}`} />
              </button>

              {showSimMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <button
                    onClick={() => handleTriggerDemoSpike("negative_spike")}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-rose-400 flex items-center gap-2 transition-colors"
                  >
                    <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                    Negative Sentiment Spike
                  </button>
                  <button
                    onClick={() => handleTriggerDemoSpike("positive_spike")}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-400 flex items-center gap-2 transition-colors"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    Positive Viral Surge
                  </button>
                  <button
                    onClick={handleTriggerFailureRecovery}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-amber-400 flex items-center gap-2 transition-colors border-t border-slate-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                    Failure Recovery Demo
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Toast Message */}
        {message && (
          <div
            className={`mt-4 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
            }`}
          >
            <span className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 ml-4">✕</button>
          </div>
        )}
      </div>

      {/* ── Pipeline Stepper ── */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="flex items-start justify-between overflow-x-auto gap-0">
          <PipelineStep
            icon={Eye}
            label="Monitor"
            value={`${overview?.stats?.signalsCount || 0} spikes`}
            color="bg-rose-500/10 text-rose-400 border-rose-500/25"
          />
          <PipelineStep
            icon={Search}
            label="Analyze"
            value="NLP engine"
            color="bg-indigo-500/10 text-indigo-400 border-indigo-500/25"
          />
          <PipelineStep
            icon={Layers}
            label="Plan"
            value={`${campaigns.length} campaigns`}
            color="bg-violet-500/10 text-violet-400 border-violet-500/25"
          />
          <PipelineStep
            icon={Shield}
            label="Approve"
            value={`${overview?.stats?.pendingCampaignsCount || 0} pending`}
            color="bg-amber-500/10 text-amber-400 border-amber-500/25"
          />
          <PipelineStep
            icon={CreditCard}
            label="Execute"
            value={`${overview?.stats?.totalLinksCreated || 0} links`}
            color="bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
          />
          <PipelineStep
            icon={BarChart3}
            label="Measure"
            value={`₹${overview?.stats?.totalRevenueINR || 0}`}
            color="bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
            isLast
          />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Revenue</div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{(overview?.stats?.totalRevenueINR || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overview?.stats?.totalConverted || 0} conversions · {overview?.stats?.conversionRate || 0}% rate
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Payment Links</div>
          <div className="text-2xl font-bold text-white">
            {overview?.stats?.totalLinksCreated || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Auto-generated via Razorpay
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Safety Blocks</div>
          <div className="text-2xl font-bold text-amber-400">
            {overview?.stats?.totalBlockedBySafety || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Anti-abuse filters applied
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Sentiment Shift</div>
          <div className="text-2xl font-bold text-cyan-400">
            {overview?.latestSentimentShift?.positiveChange ? (
              <>+{overview.latestSentimentShift.positiveChange}%</>
            ) : (
              <span className="text-sm font-normal text-slate-500">Monitoring…</span>
            )}
          </div>
          {overview?.latestSentimentShift?.negativeChange != null && (
            <div className="text-[11px] text-rose-400 mt-1">
              Negative: {overview.latestSentimentShift.negativeChange}%
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-800/60 pb-px">
        {([
          ["campaigns", Layers, "Campaigns", campaigns.length],
          ["signals", Activity, "Signals", signals.length],
          ["actions", CreditCard, "Actions", actions.length],
        ] as [string, typeof Activity, string, number][]).map(([key, Icon, label, count]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-lg ${
              activeTab === key
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/8"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === key ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"
              }`}>
                {count}
              </span>
            )}
            {key === "campaigns" && (overview?.stats?.pendingCampaignsCount || 0) > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Campaigns ── */}
      {activeTab === "campaigns" && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/40 bg-slate-900/30 p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                <Layers className="h-7 w-7 text-slate-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">No campaigns yet</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
                When a sentiment spike is detected, the AI pipeline will automatically plan a response campaign for your review.
              </p>
              <button
                onClick={() => handleTriggerDemoSpike("negative_spike")}
                disabled={actionLoading}
                className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Run Simulation
              </button>
            </div>
          ) : (
            campaigns.map((camp) => {
              const isExpanded = expandedCampaign === camp._id;
              return (
                <div
                  key={camp._id}
                  className="rounded-xl border border-slate-800/50 bg-slate-900/50 overflow-hidden transition-all hover:border-slate-700/60"
                >
                  {/* Campaign Header Row */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedCampaign(isExpanded ? null : camp._id)}
                  >
                    <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border flex-shrink-0 ${
                      camp.campaignType === "recovery"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    }`}>
                      {camp.campaignType}
                    </span>

                    <h3 className="text-sm font-semibold text-white truncate flex-1">{camp.campaignName}</h3>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusColor(camp.status)}`}>
                      {formatLabel(camp.status)}
                    </span>

                    {/* Inline Approve/Reject for Pending */}
                    {camp.status === "pending_approval" && (
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleReject(camp._id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-lg text-[11px] font-semibold transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(camp._id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/50 p-4 pt-3 space-y-4">
                      <p className="text-xs text-slate-400">{camp.description}</p>

                      {/* Planned Actions */}
                      {camp.plannedActions && camp.plannedActions.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Planned Actions</div>
                          <div className="rounded-lg border border-slate-800/40 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-950/40 text-slate-500">
                                  <th className="text-left font-semibold px-3 py-2">Product</th>
                                  <th className="text-left font-semibold px-3 py-2">Segment</th>
                                  <th className="text-right font-semibold px-3 py-2">Discount</th>
                                  <th className="text-right font-semibold px-3 py-2">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {camp.plannedActions.map((act, i) => (
                                  <tr key={i} className="border-t border-slate-800/30 text-slate-300 hover:bg-slate-800/20">
                                    <td className="px-3 py-2 font-medium text-white">{act.product}</td>
                                    <td className="px-3 py-2">{act.targetSegment}</td>
                                    <td className="px-3 py-2 text-right">
                                      {act.discountPercent > 0 ? (
                                        <span className="text-indigo-400 font-semibold">{act.discountPercent}% off</span>
                                      ) : (
                                        <span className="text-slate-500">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400">
                                      ₹{act.finalAmount / 100}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Measurement Results */}
                      {camp.measurement && (
                        <div className="rounded-xl border border-cyan-500/15 bg-cyan-950/10 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                              <BarChart3 className="h-3 w-3" />
                              Campaign Results
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${statusColor(camp.measurement.roiStatus || "evaluating")}`}>
                              {formatLabel(camp.measurement.roiStatus || "evaluating")}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/30">
                              <div className="text-[9px] text-slate-500 font-semibold uppercase">Positive</div>
                              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                                {camp.measurement.before?.positivePercent}% → {camp.measurement.after?.positivePercent}%
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/30">
                              <div className="text-[9px] text-slate-500 font-semibold uppercase">Negative</div>
                              <div className="text-sm font-bold text-rose-400 mt-0.5">
                                {camp.measurement.before?.negativePercent}% → {camp.measurement.after?.negativePercent}%
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/30">
                              <div className="text-[9px] text-slate-500 font-semibold uppercase">Converted</div>
                              <div className="text-sm font-bold text-white mt-0.5">
                                {camp.measurement.revenueImpact?.totalConverted}/{camp.measurement.revenueImpact?.totalLinksCreated}
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/30">
                              <div className="text-[9px] text-slate-500 font-semibold uppercase">Revenue</div>
                              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                                ₹{camp.measurement.revenueImpact?.totalRevenueINR}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB: Signals ── */}
      {activeTab === "signals" && (
        <div className="space-y-3">
          {signals.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/40 bg-slate-900/30 p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-7 w-7 text-slate-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">No signals detected</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
                The AI pipeline continuously monitors sentiment trends. Spikes and anomalies will appear here.
              </p>
            </div>
          ) : (
            signals.map((sig) => (
              <div key={sig._id} className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4 space-y-3">
                {/* Signal Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${severityColor(sig.severity)}`}>
                      {sig.severity}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{sig.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{formatTime(sig.detectedAt)}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{sig.description}</p>

                {/* Sentiment Bars */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/30">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Baseline (7-day avg)</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400">Positive</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sig.baseline?.positivePercent || 0}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-400">{sig.baseline?.positivePercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400">Neutral</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${sig.baseline?.neutralPercent || 0}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-400">{sig.baseline?.neutralPercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400">Negative</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sig.baseline?.negativePercent || 0}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-400">{sig.baseline?.negativePercent}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/30">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Current Window</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400">Positive</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sig.current?.positivePercent || 0}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-400">{sig.current?.positivePercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400">Neutral</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${sig.current?.neutralPercent || 0}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-400">{sig.current?.neutralPercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 text-slate-400">Negative</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sig.current?.negativePercent || 0}%` }} />
                        </div>
                        <span className="w-8 text-right font-semibold text-rose-400">{sig.current?.negativePercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Root Cause */}
                {sig.rootCauseId && (
                  <div className="bg-indigo-950/15 border border-indigo-500/15 rounded-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Root Cause Analysis</div>
                    <p className="text-xs text-slate-300">{sig.rootCauseId.rootCause}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                      <span>Category: <strong className="text-slate-400">{sig.rootCauseId.category}</strong></span>
                      <span>Product: <strong className="text-slate-400">{sig.rootCauseId.affectedProduct}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Actions (Audit Trail) ── */}
      {activeTab === "actions" && (
        <div>
          {actions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/40 bg-slate-900/30 p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-7 w-7 text-slate-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">No actions yet</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
                Payment links and responses will be logged here once campaigns are approved and executed.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800/40 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[80px_1fr_90px_100px_80px_100px] gap-2 px-4 py-2.5 bg-slate-950/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/40">
                <div>Status</div>
                <div>Author & Content</div>
                <div>Platform</div>
                <div className="text-right">Amount</div>
                <div className="text-center">Trust</div>
                <div className="text-right">Time</div>
              </div>

              {/* Table Rows */}
              {actions.map((act) => (
                <div
                  key={act._id}
                  className="grid grid-cols-[80px_1fr_90px_100px_80px_100px] gap-2 px-4 py-3 border-b border-slate-800/20 hover:bg-slate-800/15 transition-colors items-center text-xs"
                >
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${statusColor(act.status)}`}>
                      {act.status === "permanently_failed" ? "Failed" : formatLabel(act.status)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">@{act.author}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 italic">"{act.mentionContent}"</div>
                  </div>

                  <div className="text-slate-400 uppercase text-[10px] font-semibold">
                    {act.platform}
                  </div>

                  <div className="text-right">
                    {act.razorpay?.amountINR ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono font-bold text-emerald-400">₹{act.razorpay.amountINR}</span>
                        {act.razorpay.paymentLinkUrl && (
                          <button
                            onClick={() => copyToClipboard(act.razorpay!.paymentLinkUrl!, act._id)}
                            className="p-0.5 text-slate-500 hover:text-indigo-400 transition-colors"
                            title="Copy payment link"
                          >
                            {copiedId === act._id ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>

                  <div className="text-center">
                    <span className={`text-[10px] font-bold ${
                      act.credibilityScore >= 0.7 ? "text-emerald-400" :
                      act.credibilityScore >= 0.4 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {Math.round(act.credibilityScore * 100)}%
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 font-mono">
                    {formatTime(act.createdAt)}
                  </div>

                  {/* Outreach Message / Agent Direct Action */}
                  {act.outreachMessage && act.status !== "blocked" && (
                    <div className="col-span-6 mt-2 rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          <MessageSquare className="h-3 w-3" /> Agent Response Sent via {act.platform}
                        </span>
                        {act.razorpay?.paymentLinkUrl && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {act.razorpay.paymentLinkId || "rzp_link"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono bg-slate-950/40 rounded p-2 border border-slate-800/40">
                        {act.outreachMessage}
                      </p>
                      {act.razorpay?.paymentLinkUrl && (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={act.razorpay.paymentLinkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neon-cyan hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Open Live Razorpay Checkout
                            </a>
                            <button
                              onClick={() => copyToClipboard(act.razorpay!.paymentLinkUrl!, act._id)}
                              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded px-1.5 py-0.5 bg-slate-800/40"
                              title="Copy checkout link"
                            >
                              {copiedId === act._id ? (
                                <>
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-2.5 w-2.5" /> Copy Link
                                </>
                              )}
                            </button>
                          </div>

                          {act.status !== "converted" && (
                            <button
                              onClick={() => handleMarkPayment(act._id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center gap-1 transition-all"
                            >
                              <DollarSign className="h-3 w-3" /> Simulate Customer Payment
                            </button>
                          )}
                          {act.status === "converted" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Payment Converted (+₹{act.razorpay.amountINR || 499})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blocked by Policy Explanation */}
                  {act.status === "blocked" && (
                    <div className="col-span-6 mt-2 rounded-lg border border-amber-500/20 bg-amber-950/15 p-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                        <Shield className="h-3 w-3" /> Policy Guardrail Triggered:
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {act.actionReason || "Filtered due to non-consumer platform or account credibility below 50%. Anti-abuse policy prevented discount link issuance."}
                      </p>
                    </div>
                  )}

                  {/* Error display */}
                  {act.error && (
                    <div className="col-span-6 mt-1 flex items-center gap-1.5 text-[10px] text-rose-400">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span>{act.error.message}</span>
                      {act.error.willRetry && <span className="text-amber-400">(retry scheduled)</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
