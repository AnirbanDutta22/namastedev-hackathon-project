import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

const SUGGESTIONS = [
  "What is my weakest server?",
  "What happens if the Redis cache is hacked?",
  "Which subnet should be isolated first?",
  "What should I patch first?",
];

export default function ChatPanel({ sessionId, open, onClose, persona }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const color = persona?.color || "var(--signal)";

  // Escape closes the modal, like any self-respecting overlay should.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function send(question) {
    if (!question.trim() || !sessionId) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.ask(sessionId, question, persona?.id);
      setMessages((m) => [...m, { role: "ai", text: res.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,7,12,0.75)",
        backdropFilter: "blur(6px)",
        animation: "backdropIn 0.25s ease-out both",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 94vw)",
          height: "min(760px, 88vh)",
          background: "rgba(11,15,23,0.97)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 40px 100px -30px rgba(0,0,0,0.85), 0 0 0 1px ${color}22`,
          animation: "modalPop 0.45s var(--ease-out) both",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--panel-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `${color}22`,
                color,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${color}55`,
                animation: "ringPulse 2.2s ease-out infinite",
              }}
            >
              {persona?.glyph || "A"}
            </span>
            <div>
              <div
                className="display"
                style={{ fontWeight: 600, fontSize: 16 }}
              >
                {persona?.name || "Pentest AI"}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color,
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                {persona?.callsign || "AI COPILOT"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: 14,
              cursor: "pointer",
              width: 30,
              height: 30,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}
          className="scrollbar-thin"
        >
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {messages.length === 0 && (
              <div className="anim-fade-up">
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  Ask {persona?.name || "Pentest AI"} anything about this
                  network — grounded in the actual graph, answered in character.
                  Try:
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        textAlign: "left",
                        background: "var(--panel-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "border-color 0.15s, transform 0.15s",
                        lineHeight: 1.4,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className="anim-fade-up"
                style={{
                  marginBottom: 20,
                  fontSize: 14,
                  lineHeight: 1.6,
                  animationDuration: "0.35s",
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: m.role === "user" ? "var(--text-dim)" : color,
                    marginBottom: 5,
                    fontWeight: 700,
                  }}
                >
                  {m.role === "user" ? "You" : persona?.name || "Pentest AI"}
                </div>
                <div style={{ color: "var(--text)" }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: color,
                    animation: "pulseDot 0.9s ease-in-out infinite",
                  }}
                />
                Analyzing graph…
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "18px 32px 24px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              display: "flex",
              gap: 10,
            }}
          >
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask a question…"
              style={{
                flex: 1,
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: 8,
                padding: "13px 14px",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={() => send(input)}
              style={{
                background: color,
                color: "#05070c",
                border: "none",
                borderRadius: 8,
                padding: "13px 20px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
