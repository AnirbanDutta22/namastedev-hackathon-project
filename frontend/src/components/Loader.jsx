import React, { useEffect, useState } from "react";

const DEFAULT_MESSAGES = [
  "Establishing secure session…",
  "Parsing topology…",
  "Mapping trust relationships…",
  "Provisioning attacker cognition…",
  "Calibrating risk model…",
];

export default function Loader({
  messages = DEFAULT_MESSAGES,
  label = "NETTWIN AI",
  fullscreen = true,
  color,
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % messages.length), 950);
    return () => clearInterval(id);
  }, [messages.length]);

  const accent = color || "var(--signal)";

  const content = (
    <div
      className="anim-fade-in"
      style={{
        position: "relative",
        width: 320,
        padding: "26px 26px 22px",
        background: "rgba(13,17,25,0.7)",
        backdropFilter: "blur(10px)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* corner brackets */}
      {[
        { top: -1, left: -1, borderRight: 0, borderBottom: 0 },
        { top: -1, right: -1, borderLeft: 0, borderBottom: 0 },
        { bottom: -1, left: -1, borderRight: 0, borderTop: 0 },
        { bottom: -1, right: -1, borderLeft: 0, borderTop: 0 },
      ].map((pos, idx) => (
        <span
          key={idx}
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            border: `2px solid ${accent}`,
            ...pos,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: accent,
            display: "inline-block",
            animation: "pulseDot 1.1s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "var(--text)",
          minHeight: 20,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          key={i}
          className="anim-fade-in"
          style={{ animationDuration: "0.35s" }}
        >
          {messages[i]}
        </span>
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 14,
            marginLeft: 4,
            background: accent,
            animation: "blink 0.9s step-start infinite",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 16,
          height: 3,
          borderRadius: 2,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: accent,
            animation: "barLoad 2.6s ease-in-out infinite alternate",
          }}
        />
      </div>
    </div>
  );

  if (!fullscreen) return content;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,7,12,0.72)",
        backdropFilter: "blur(4px)",
      }}
    >
      {content}
    </div>
  );
}
