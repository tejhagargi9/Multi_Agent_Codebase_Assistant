import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const AGENTS = [
  {
    id: "retriever",
    name: "Code Retriever",
    label: "RAG · Context",
    color: "#38bdf8",
    ringColor: "ring-sky-500/30",
    borderColor: "border-sky-500/20",
    bgColor: "bg-sky-500/5",
    dotColor: "bg-sky-400",
    textAccent: "text-sky-400",
    avatar: "R",
    grad: "from-sky-800 to-sky-500",
    tagline: "Finds relevant code from your codebase via RAG",
    persona: `You are a Code Retrieval agent in a DevOps pipeline. Your job: given a bug report or code question, simulate what a Pinecone RAG retrieval would return. Output ONLY code snippets and brief file/function context — no analysis, no fixes. Format your response as if you're showing retrieved code chunks with file paths and short context lines. Use markdown code blocks. Keep it realistic and relevant to the query. Start with "Retrieved context:" then show 1-3 relevant code snippets with file paths as headers.`,
  },
  {
    id: "analyzer",
    name: "Bug Analyzer",
    label: "Root Cause",
    color: "#f59e0b",
    ringColor: "ring-amber-500/30",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/5",
    dotColor: "bg-amber-400",
    textAccent: "text-amber-400",
    avatar: "A",
    grad: "from-amber-800 to-amber-500",
    tagline: "Diagnoses root cause and failure mode",
    persona: `You are a Bug Analyzer agent in a DevOps pipeline. Your job: given a developer's bug report, perform a sharp root cause analysis. Identify the most likely cause, failure mode, and which part of the stack is responsible. Be concise and precise — use a 2-3 sentence root cause summary, then a short bulleted breakdown of contributing factors. Start with "Root cause:" followed by a one-line diagnosis.`,
  },
  {
    id: "fixer",
    name: "Fix Generator",
    label: "Patch · Solution",
    color: "#10b981",
    ringColor: "ring-emerald-500/30",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/5",
    dotColor: "bg-emerald-400",
    textAccent: "text-emerald-400",
    avatar: "F",
    grad: "from-emerald-900 to-emerald-500",
    tagline: "Generates a concrete code fix or patch",
    persona: `You are a Fix Generator agent in a DevOps pipeline. Your job: given a bug description, write a concrete, working code fix. Output the patched code in a markdown code block with the file path or function name as a header. Briefly explain (1-2 sentences) what changed and why. Be practical — prefer minimal, targeted fixes over rewrites. Start with "Proposed fix:" then the code block.`,
  },
  {
    id: "reviewer",
    name: "Reviewer",
    label: "QA · Feedback",
    color: "#a78bfa",
    ringColor: "ring-violet-500/30",
    borderColor: "border-violet-500/20",
    bgColor: "bg-violet-500/5",
    dotColor: "bg-violet-400",
    textAccent: "text-violet-400",
    avatar: "V",
    grad: "from-violet-900 to-violet-500",
    tagline: "Reviews fix for correctness, edge cases, style",
    persona: `You are a Code Reviewer agent in a DevOps pipeline. Your job: review a proposed fix critically but constructively. Check for: correctness, edge cases missed, potential regressions, code style, and whether the fix actually addresses the root cause. Give a verdict (✅ Approve / ⚠️ Approve with changes / ❌ Request changes), then 2-4 bullet points of specific feedback. Start with your verdict on a single line.`,
  },
];

const SUGGESTED = [
  "Login endpoint returns 401 even with valid JWT — token expiry logic seems off",
  "Database connection pool exhausted under load — queries timing out after 30s",
  "React component re-renders infinitely when fetching user profile on mount",
  "CI pipeline fails on Docker build step with 'COPY failed: file not found'",
];

function TypingDots({ color }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function formatContent(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const result = [];
  let inCode = false;
  let codeLines = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        result.push(
          <pre
            key={key++}
            className="my-2 rounded-lg bg-black/40 border border-white/5 p-3 overflow-x-auto text-xs leading-relaxed font-mono text-slate-300"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        inCode = false;
        codeLines = [];
      }
    } else if (inCode) {
      codeLines.push(line);
    } else if (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ")) {
      const txt = line.replace(/^#+\s/, "");
      result.push(
        <p key={key++} className="text-slate-200 text-sm font-semibold mt-2 mb-0.5">
          {txt}
        </p>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      result.push(
        <div key={key++} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
          <span className="mt-2 w-1 h-1 rounded-full bg-slate-500 flex-shrink-0" />
          <span>{line.slice(2)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      result.push(<div key={key++} className="h-1" />);
    } else {
      result.push(
        <p key={key++} className="text-slate-300 text-sm leading-relaxed">
          {line}
        </p>
      );
    }
  }
  return result;
}

function AgentCard({ agent, message, isStreaming, index, isVisible }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [message, isStreaming]);

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-500
        ${agent.bgColor} ${agent.borderColor}
        ${isStreaming ? `ring-1 ${agent.ringColor}` : ""}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{
        transitionDelay: `${index * 60}ms`,
        boxShadow: isStreaming ? `0 0 28px ${agent.color}12` : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-600 font-mono w-4 text-right">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
            style={{ boxShadow: `0 2px 10px ${agent.color}30` }}
          >
            {agent.avatar}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-slate-100 text-sm font-semibold leading-tight">{agent.name}</div>
          <div className={`text-[10px] font-medium uppercase tracking-widest mt-0.5 ${agent.textAccent}`}>
            {agent.label}
          </div>
        </div>

        <div className="flex-shrink-0">
          {isStreaming ? (
            <TypingDots color={agent.color} />
          ) : message ? (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: `${agent.color}18` }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5l2.5 2.5L8.5 2" stroke={agent.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className={`w-1.5 h-1.5 rounded-full ${agent.dotColor} opacity-20`} />
          )}
        </div>
      </div>

      <div
        ref={contentRef}
        className="px-5 py-4 max-h-72 overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}
      >
        {!message && !isStreaming ? (
          <p className="text-slate-700 text-sm italic">Waiting in queue…</p>
        ) : isStreaming && !message ? (
          <TypingDots color={agent.color} />
        ) : (
          <div className="space-y-0.5">{formatContent(message)}</div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-lg rounded-2xl rounded-br-sm px-5 py-3.5 text-sm leading-relaxed text-slate-100"
        style={{
          background: "linear-gradient(135deg, #1e3a5f, #1a6fad)",
          boxShadow: "0 4px 20px rgba(14,78,130,0.25)",
          fontFamily: "'Lora', serif",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function DevOpsAgentChat() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState({});
  const [agentMessages, setAgentMessages] = useState({});
  const [visibleCards, setVisibleCards] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeRound, setActiveRound] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const agentMessagesRef = useRef({});

  const updateAgentMessage = (key, text) => {
    setAgentMessages((prev) => {
      const next = { ...prev, [key]: text };
      agentMessagesRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, agentMessages]);

  const streamAgent = async (agent, query, roundId) => {
    setStreaming((p) => ({ ...p, [agent.id]: true }));

    setTimeout(() => {
      setVisibleCards((p) => ({ ...p, [`${roundId}-${agent.id}`]: true }));
    }, AGENTS.indexOf(agent) * 80);

    // === REAL BACKEND RETRIEVER (first agent) ===
    if (agent.id === "retriever") {
      try {
        const namespace = localStorage.getItem('namespace');
        const resp = await fetch("http://127.0.0.1:8000/devops/retrieve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query, 
            namespace: namespace || null,
            session_id: roundId,     // so backend can store in DevOpsState
          }),
        });
        const data = await resp.json();
        const text = data.retrieved_code || "No relevant code found in the indexed codebase.";
        updateAgentMessage(`${roundId}-${agent.id}`, text);
      } catch {
        updateAgentMessage(`${roundId}-${agent.id}`, "⚠ Could not reach the backend retriever.");
      }
      setStreaming((p) => ({ ...p, [agent.id]: false }));
      return;
    }

    // === REAL BACKEND BUG ANALYZER (second agent) ===
    if (agent.id === "analyzer") {
      try {
        const resp = await fetch("http://127.0.0.1:8000/devops/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query, 
            session_id: roundId,           // backend will pull retrieved_code from DevOpsState
          }),
        });
        const data = await resp.json();
        const text = data.bug_analysis || "No analysis generated.";
        updateAgentMessage(`${roundId}-${agent.id}`, text);
      } catch {
        updateAgentMessage(`${roundId}-${agent.id}`, "⚠ Could not reach the backend analyzer.");
      }
      setStreaming((p) => ({ ...p, [agent.id]: false }));
      return;
    }

    // === Remaining simulated agents (Fixer, Reviewer) still use Anthropic ===
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          stream: true,
          system: agent.persona,
          messages: [{ role: "user", content: query }],
        }),
      });

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const d = line.slice(6).trim();
            if (d === "[DONE]") continue;
            try {
              const parsed = JSON.parse(d);
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                setAgentMessages((p) => ({
                  ...p,
                  [`${roundId}-${agent.id}`]: (p[`${roundId}-${agent.id}`] || "") + parsed.delta.text,
                }));
              }
            } catch {}
          }
        }
      }
    } catch {
      setAgentMessages((p) => ({
        ...p,
        [`${roundId}-${agent.id}`]: "⚠ Could not reach the API.",
      }));
    }

    setStreaming((p) => ({ ...p, [agent.id]: false }));
  };

  const handleSubmit = useCallback(
    async (prefill) => {
      const q = (prefill ?? input).trim();
      if (!q || isLoading) return;

      const roundId = Date.now().toString();
      agentMessagesRef.current = {};
      setInput("");
      setIsLoading(true);
      setActiveRound(roundId);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      setHistory((p) => [...p, { type: "user", text: q }, { type: "agents", roundId }]);

      // Run agents sequentially so later agents (analyzer, etc.) can use output from previous ones
      for (const agent of AGENTS) {
        await streamAgent(agent, q, roundId);
      }
      setIsLoading(false);
    },
    [input, isLoading]
  );

  const adjustTextarea = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    }
  };

  const anyStreaming = Object.values(streaming).some(Boolean);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080c14", fontFamily: "'Lora', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.45s ease both; }
        textarea { resize: none; outline: none; background: transparent; border: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
      `}</style>

      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5"
        style={{ background: "rgba(8,12,20,0.96)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0f4c81,#1a6fad)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" opacity="0.9" />
              <rect x="9" y="1" width="5" height="5" rx="1.2" fill="white" opacity="0.5" />
              <rect x="1" y="9" width="5" height="5" rx="1.2" fill="white" opacity="0.5" />
              <rect x="9" y="9" width="5" height="5" rx="1.2" fill="white" opacity="0.25" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs px-3 py-1 rounded-full border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Upload
            </Link>
            <div>
              <div className="text-slate-100 text-sm font-bold" style={{ fontFamily: "'Syne',sans-serif" }}>
                DevOps Agent Pipeline
              </div>
              <div className="text-[10px] text-slate-600 tracking-widest uppercase mt-0.5" style={{ fontFamily: "'Syne',sans-serif" }}>
                4-stage · Retrieve → Analyze → Fix → Review
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {AGENTS.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all duration-300 ${a.borderColor}`}
              style={{
                fontFamily: "'Syne',sans-serif",
                background: streaming[a.id] ? `${a.color}15` : "transparent",
                color: streaming[a.id] ? a.color : "#334155",
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${a.dotColor} transition-opacity duration-300`}
                style={{ opacity: streaming[a.id] ? 1 : 0.2 }}
              />
              {a.avatar}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-10">
        <div className="max-w-2xl mx-auto">
          {history.length === 0 && (
            <div className="fade-up">
              <div className="text-center mb-14">
                <h1
                  className="font-extrabold leading-tight mb-4"
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: "clamp(32px,5vw,52px)",
                    color: "#f8fafc",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Describe your bug.
                  <br />
                  <span style={{ background: "linear-gradient(90deg,#38bdf8,#818cf8,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Four agents debug it.
                  </span>
                </h1>
                <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto italic">
                  Your query flows sequentially through retrieve → analyze → fix → review — a real DevOps AI pipeline.
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-12">
                {AGENTS.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${a.bgColor} ${a.borderColor}`}
                    style={{ animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}
                  >
                    <span className="text-[10px] font-bold text-slate-700 font-mono w-5 text-right flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${a.grad} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}
                    >
                      {a.avatar}
                    </div>
                    <div className="flex-1">
                      <span className="text-slate-200 text-sm font-semibold" style={{ fontFamily: "'Syne',sans-serif" }}>
                        {a.name}
                      </span>
                      <span className="text-slate-600 text-xs ml-2">· {a.tagline}</span>
                    </div>
                    {i < AGENTS.length - 1 && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 opacity-20">
                        <path d="M7 2v10M3 8l4 4 4-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] text-slate-700 tracking-widest uppercase mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>
                  Try asking
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(s)}
                      className="text-left text-sm text-slate-500 px-4 py-3 rounded-xl border border-white/5 hover:border-white/10 hover:text-slate-300 hover:bg-white/[0.03] transition-all duration-150 flex items-center justify-between gap-3"
                      style={{ animation: `fadeUp 0.5s ease ${0.32 + i * 0.07}s both`, fontFamily: "'Lora',serif" }}
                    >
                      {s}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 opacity-30">
                        <path d="M2 6h8M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {history.map((item, idx) => {
            if (item.type === "user") {
              return (
                <div key={idx} className="mb-6 fade-up">
                  <UserBubble text={item.text} />
                </div>
              );
            }

            if (item.type === "agents") {
              const isActive = item.roundId === activeRound;
              return (
                <div key={idx} className="mb-12 fade-up">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] tracking-widest text-slate-700" style={{ fontFamily: "'Syne',sans-serif" }}>
                      {isActive && anyStreaming ? "PIPELINE RUNNING" : "PIPELINE COMPLETE"}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="flex flex-col gap-3">
                    {AGENTS.map((agent, i) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        index={i}
                        message={agentMessages[`${item.roundId}-${agent.id}`]}
                        isStreaming={isActive && !!streaming[agent.id]}
                        isVisible={!!visibleCards[`${item.roundId}-${agent.id}`] || !isActive}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer
        className="border-t border-white/5 px-8 py-4"
        style={{ background: "rgba(8,12,20,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className={`flex gap-3 items-end rounded-2xl border px-4 py-3 transition-all duration-300 ${
              isLoading ? "border-sky-500/30" : "border-white/8 hover:border-white/12"
            }`}
            style={{
              background: "rgba(255,255,255,0.025)",
              boxShadow: isLoading ? "0 0 28px rgba(56,189,248,0.07)" : "none",
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Describe your bug, error, or code question…"
              disabled={isLoading}
              className="flex-1 text-sm text-slate-200 placeholder-slate-700 leading-relaxed"
              style={{ minHeight: 24, maxHeight: 140, fontFamily: "'Lora',serif" }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg,#0369a1,#38bdf8)"
                  : "rgba(56,189,248,0.08)",
                boxShadow: input.trim() && !isLoading ? "0 3px 14px rgba(56,189,248,0.35)" : "none",
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              }}
            >
              {isLoading ? (
                <div
                  className="w-4 h-4 rounded-full border-2 border-sky-900 border-t-sky-400"
                  style={{ animation: "spin 0.75s linear infinite" }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h9M7.5 3.5L11 7l-3.5 3.5" stroke={input.trim() ? "white" : "#1e4a6e"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-5 mt-2.5">
            {AGENTS.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${a.dotColor} transition-opacity duration-300`}
                  style={{ opacity: streaming[a.id] ? 1 : 0.15 }}
                />
                <span className="text-[10px] text-slate-700" style={{ fontFamily: "'Syne',sans-serif" }}>
                  {a.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
