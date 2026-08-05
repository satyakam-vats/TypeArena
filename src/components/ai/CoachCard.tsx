/* ───────────────────────────────────────────────────────────────────
 *  TypeArena – AI Coach Card (v2 — Premium Glassmorphic + Gemini)
 *  Local analysis + optional Gemini 1.5 Flash AI integration.
 *  100% free: Gemini free tier (1,500 req/day, no credit card).
 * ─────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Key,
  Play,
  Loader2,
  Settings,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import type { CompletedRun } from "../../types/typing";
import { analyzeRun } from "../../lib/ai/coachEngine";
import type { CoachInsight } from "../../lib/ai/types";
import {
  generateGeminiAnalysis,
  hasGeminiApiKey,
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
  type GeminiCoachResult,
} from "../../lib/ai/geminiClient";
import { useNavigate } from "react-router-dom";

type CoachCardProps = {
  run: CompletedRun;
  className?: string;
};

type Tab = "overview" | "ai-analysis" | "breakdown";

/* ── Category Icons ─────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  rhythm: <TrendingUp size={13} />,
  accuracy: <Target size={13} />,
  speed: <Zap size={13} />,
  endurance: <TrendingUp size={13} />,
  technique: <Key size={13} />,
  strength: <Sparkles size={13} />,
  improvement: <TrendingUp size={13} />,
};

/* ── Insight Row ────────────────────────────────────────────── */
function InsightRow({
  insight,
  defaultOpen,
}: {
  insight: CoachInsight;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`coach-v2-insight ${open ? "is-open" : ""}`} data-priority={insight.priority}>
      <button
        type="button"
        className="coach-v2-insight-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="coach-v2-insight-icon">{CATEGORY_ICONS[insight.category] || <Sparkles size={13} />}</span>
        <span className="coach-v2-insight-title">{insight.title}</span>
        <span className={`coach-v2-tag coach-v2-tag--${insight.category}`}>{insight.category}</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <div className={`coach-v2-insight-body ${open ? "is-visible" : ""}`}>
        <p className="coach-v2-detail">{insight.detail}</p>
        <p className="coach-v2-action">
          <Sparkles size={11} />
          {insight.actionable}
        </p>
      </div>
    </div>
  );
}

/* ── Skill Level Badge ──────────────────────────────────────── */
function SkillBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    beginner: "#f59e0b",
    intermediate: "#3b82f6",
    advanced: "#8b5cf6",
    expert: "#ef4444",
  };
  return (
    <span className="coach-v2-skill-badge" style={{ "--badge-color": colors[level] || "#3b82f6" } as React.CSSProperties}>
      {level}
    </span>
  );
}

/* ── API Key Setup Modal ────────────────────────────────────── */
function ApiKeyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [key, setKey] = useState(getGeminiApiKey() || "");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const testKey = async () => {
    if (!key.trim()) return;
    setTesting(true);
    setStatus("idle");
    try {
      // Use the lightweight models list endpoint to validate the key —
      // it's a simple GET and doesn't depend on specific model availability.
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key.trim()}`,
      );
      if (resp.ok) {
        setGeminiApiKey(key.trim());
        setStatus("success");
        setTimeout(() => { onSaved(); onClose(); }, 600);
      } else {
        console.warn("Gemini key test failed:", resp.status, await resp.text().catch(() => ""));
        setStatus("error");
      }
    } catch (err) {
      console.warn("Gemini key test error:", err);
      setStatus("error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="coach-v2-modal-backdrop" onClick={onClose}>
      <div className="coach-v2-modal" onClick={(e) => e.stopPropagation()}>
        <button className="coach-v2-modal-close" onClick={onClose}><X size={16} /></button>
        <div className="coach-v2-modal-header">
          <Brain size={20} />
          <h3>Connect Gemini AI</h3>
        </div>
        <p className="coach-v2-modal-desc">
          Get a <strong>free</strong> API key from{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>{" "}
          — no credit card required. 1,500 free requests/day.
        </p>
        <div className="coach-v2-modal-input-row">
          <input
            type="password"
            placeholder="Paste your Gemini API key..."
            value={key}
            onChange={(e) => { setKey(e.target.value); setStatus("idle"); }}
            className="coach-v2-modal-input"
            autoFocus
          />
          <button
            className="coach-v2-modal-test-btn"
            onClick={() => void testKey()}
            disabled={testing || !key.trim()}
          >
            {testing ? <Loader2 size={14} className="spin" /> : status === "success" ? <Check size={14} /> : "Test"}
          </button>
        </div>
        {status === "error" && (
          <p className="coach-v2-modal-error">
            <AlertCircle size={13} /> Invalid key. Check it and try again.
          </p>
        )}
        {status === "success" && (
          <p className="coach-v2-modal-success">
            <Check size={13} /> Connected! AI Coach is ready.
          </p>
        )}
        {hasGeminiApiKey() && (
          <button
            className="coach-v2-modal-disconnect"
            onClick={() => { clearGeminiApiKey(); setKey(""); setStatus("idle"); }}
          >
            Disconnect current key
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Coach Card ────────────────────────────────────────── */
export function CoachCard({ run, className }: CoachCardProps) {
  const navigate = useNavigate();
  const localAnalysis = useMemo(() => analyzeRun(run), [run]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiConnected, setAiConnected] = useState(hasGeminiApiKey());

  // Gemini AI state
  const [geminiResult, setGeminiResult] = useState<GeminiCoachResult | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState(false);
  const geminiRequested = useRef(false);

  // Auto-fetch Gemini analysis when AI tab is opened (if connected)
  useEffect(() => {
    if (activeTab !== "ai-analysis") return;
    if (!aiConnected) return;
    if (geminiResult || geminiLoading || geminiRequested.current) return;
    geminiRequested.current = true;
    setGeminiLoading(true);
    setGeminiError(false);
    generateGeminiAnalysis(run)
      .then((result) => {
        if (result) {
          setGeminiResult(result);
        } else {
          setGeminiError(true);
        }
      })
      .catch(() => setGeminiError(true))
      .finally(() => setGeminiLoading(false));
  }, [activeTab, aiConnected, geminiResult, geminiLoading, run]);

  const retryGemini = useCallback(() => {
    geminiRequested.current = false;
    setGeminiResult(null);
    setGeminiLoading(true);
    setGeminiError(false);
    generateGeminiAnalysis(run)
      .then((result) => {
        if (result) {
          setGeminiResult(result);
        } else {
          setGeminiError(true);
        }
      })
      .catch(() => setGeminiError(true))
      .finally(() => setGeminiLoading(false));
  }, [run]);

  const launchDrill = useCallback(() => {
    if (!geminiResult?.drillText) return;
    // Store the custom drill text and navigate to solo test
    sessionStorage.setItem("typearena_ai_drill", geminiResult.drillText);
    navigate("/?source=ai-drill");
  }, [geminiResult, navigate]);

  if (localAnalysis.insights.length === 0 && !aiConnected) return null;

  return (
    <>
      <section className={`coach-v2 ${className ?? ""}`}>
        {/* ── Gradient border glow ── */}
        <div className="coach-v2-glow" />

        {/* ── Header ── */}
        <div className="coach-v2-header">
          <div className="coach-v2-brand">
            <div className="coach-v2-logo">
              <Brain size={15} />
            </div>
            <span className="coach-v2-brand-text">AI Coach</span>
            {aiConnected && (
              <span className="coach-v2-live-dot" title="Gemini AI Connected">
                <span />
              </span>
            )}
          </div>
          <div className="coach-v2-header-actions">
            <button
              className="coach-v2-settings-btn"
              onClick={() => setShowKeyModal(true)}
              title={aiConnected ? "Gemini Connected" : "Connect Gemini AI"}
            >
              <Settings size={13} />
              {aiConnected ? "Connected" : "Connect AI"}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="coach-v2-tabs">
          <button
            className={`coach-v2-tab ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Zap size={12} /> Overview
          </button>
          <button
            className={`coach-v2-tab ${activeTab === "ai-analysis" ? "is-active" : ""}`}
            onClick={() => setActiveTab("ai-analysis")}
          >
            <Sparkles size={12} /> AI Analysis
          </button>
          <button
            className={`coach-v2-tab ${activeTab === "breakdown" ? "is-active" : ""}`}
            onClick={() => setActiveTab("breakdown")}
          >
            <Target size={12} /> Breakdown
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="coach-v2-content">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="coach-v2-overview">
              <div className="coach-v2-summary-strip">
                <div className="coach-v2-focus-area">
                  <span className="coach-v2-focus-label">Focus Area</span>
                  <span className="coach-v2-focus-value">{localAnalysis.focusArea}</span>
                </div>
              </div>
              <div className="coach-v2-quick-insights">
                {localAnalysis.insights.slice(0, 3).map((insight, i) => (
                  <div key={i} className="coach-v2-quick-card">
                    <span className="coach-v2-quick-icon">{insight.emoji}</span>
                    <div>
                      <p className="coach-v2-quick-title">{insight.title}</p>
                      <p className="coach-v2-quick-detail">{insight.actionable}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="coach-v2-encouragement">
                {localAnalysis.encouragement}
              </div>
            </div>
          )}

          {/* ── AI ANALYSIS TAB ── */}
          {activeTab === "ai-analysis" && (
            <div className="coach-v2-ai-tab">
              {!aiConnected ? (
                <div className="coach-v2-connect-prompt">
                  <div className="coach-v2-connect-icon">
                    <Sparkles size={28} />
                  </div>
                  <h4>Unlock AI-Powered Insights</h4>
                  <p>
                    Connect Google's Gemini AI for personalized natural-language analysis,
                    custom practice drills targeting your weak spots, and expert technique diagnosis.
                  </p>
                  <p className="coach-v2-free-note">
                    100% free — no credit card needed. Get your key from{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                      Google AI Studio
                    </a>
                  </p>
                  <button
                    className="coach-v2-connect-btn"
                    onClick={() => setShowKeyModal(true)}
                  >
                    <Key size={14} /> Connect Gemini AI
                  </button>
                </div>
              ) : geminiLoading ? (
                <div className="coach-v2-loading">
                  <Loader2 size={24} className="spin" />
                  <p>Analyzing your performance with Gemini AI...</p>
                </div>
              ) : geminiError ? (
                <div className="coach-v2-error-state">
                  <AlertCircle size={20} />
                  <p>Couldn't get AI analysis this time.</p>
                  <button onClick={retryGemini} className="coach-v2-retry-btn">
                    Retry
                  </button>
                </div>
              ) : geminiResult ? (
                <div className="coach-v2-gemini-result">
                  {/* Skill Level + Summary */}
                  <div className="coach-v2-ai-header-row">
                    <SkillBadge level={geminiResult.skillLevel} />
                    <span className="coach-v2-ai-powered">Powered by Gemini</span>
                  </div>

                  <div className="coach-v2-ai-summary">
                    <p>{geminiResult.summary}</p>
                  </div>

                  {/* Diagnosis */}
                  <div className="coach-v2-ai-section">
                    <h5><Target size={13} /> Diagnosis</h5>
                    <p>{geminiResult.diagnosis}</p>
                  </div>

                  {/* Action Plan */}
                  <div className="coach-v2-ai-section">
                    <h5><TrendingUp size={13} /> Action Plan</h5>
                    <ol className="coach-v2-action-plan">
                      {geminiResult.actionPlan.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Custom Drill */}
                  {geminiResult.drillText && (
                    <div className="coach-v2-drill-box">
                      <div className="coach-v2-drill-header">
                        <h5><Target size={13} /> Custom Practice Drill</h5>
                        <button onClick={launchDrill} className="coach-v2-drill-launch">
                          <Play size={12} /> Practice Now
                        </button>
                      </div>
                      <p className="coach-v2-drill-text">{geminiResult.drillText}</p>
                    </div>
                  )}

                  {/* Encouragement */}
                  <div className="coach-v2-ai-encouragement">
                    {geminiResult.encouragement}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ── BREAKDOWN TAB ── */}
          {activeTab === "breakdown" && (
            <div className="coach-v2-breakdown">
              {localAnalysis.insights.map((insight, i) => (
                <InsightRow key={i} insight={insight} defaultOpen={i === 0} />
              ))}
              {localAnalysis.insights.length === 0 && (
                <p className="coach-v2-empty">Complete more tests to unlock detailed breakdowns.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {showKeyModal && (
        <ApiKeyModal
          onClose={() => setShowKeyModal(false)}
          onSaved={() => { setAiConnected(true); }}
        />
      )}
    </>
  );
}
