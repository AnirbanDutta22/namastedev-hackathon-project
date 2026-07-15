import React, { useState } from "react";
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
      className="anim-scale-in"
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        bottom: 16,
        width: 340,
        background: "rgba(13,17,25,0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: `${color}22`,
              color,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {persona?.glyph || "A"}
          </span>
          <div>
            <div className="display" style={{ fontWeight: 600, fontSize: 13 }}>
              {persona?.name || "NetTwin AI"}
            </div>
            <div
              className="mono"
              style={{ fontSize: 9, color, letterSpacing: "0.08em" }}
            >
              {persona?.callsign || "AI COPILOT"}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: 14 }}
        className="scrollbar-thin"
      >
        {messages.length === 0 && (
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              Ask {persona?.name || "NetTwin AI"} anything about this network.
              Try:
            </div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 6,
                  background: "var(--panel-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = color)}
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.55 }}
          >
            <div
              className="mono"
              style={{
                fontSize: 9.5,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: m.role === "user" ? "var(--text-dim)" : color,
                marginBottom: 3,
                fontWeight: 700,
              }}
            >
              {m.role === "user" ? "You" : persona?.name || "NetTwin AI"}
            </div>
            <div style={{ color: "var(--text)" }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
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

      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask a question…"
          style={{
            flex: 1,
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: 6,
            padding: "9px 10px",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={() => send(input)}
          style={{
            background: color,
            color: "#05070c",
            border: "none",
            borderRadius: 6,
            padding: "9px 14px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
