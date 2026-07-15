import React, { useEffect, useRef } from "react";

// Professional Theme Tokens
const THEME = {
  panel: "#111827",
  panelHeader: "#0d131f",
  border: "#1f2937",
  borderAccent: "#374151",
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  accent: "#3b82f6",
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
};

// Enterprise MITRE Matrix Mapping Colors
const STAGE_COLOR = {
  "Initial Access": "#3b82f6", // Diagnostic Blue
  "Privilege Escalation": "#a855f7", // System Purple
  "Credential Access": "#ec4899", // Vector Pink
  "Lateral Movement": "#f59e0b", // Alert Amber
  Persistence: "#ef4444", // Critical Red
  Exfiltration: "#ef4444", // Critical Red
  Impact: "#ef4444", // Critical Red
};

// Crisp Engineering Vectors
const ControlIcons = {
  Prev: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  ),
  Next: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  ),
  Play: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  Pause: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="4" width="4" height="16" rx="1" />
      <rect x="15" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  Close: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Shield: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export default function AttackPanel({
  result,
  playIndex,
  onPlayIndexChange,
  playing,
  onPlayingChange,
  onClose,
  personaColor = THEME.accent,
}) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!playing || !result) return;
    timerRef.current = setInterval(() => {
      onPlayIndexChange((i) => {
        if (i >= result.hops.length - 1) {
          onPlayingChange(false);
          return i;
        }
        return i + 1;
      });
    }, 1600);
    return () => clearInterval(timerRef.current);
  }, [playing, result]);

  if (!result) return null;
  const hops = result.hops;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        background: THEME.panel,
        border: `1px solid ${THEME.borderAccent}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        maxHeight: "35vh",
        boxShadow: "0 12px 40px -12px rgba(0, 0, 0, 0.7)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Dynamic Simulation Terminal Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.panelHeader,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: THEME.text,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: personaColor,
                display: "inline-block",
                animation: "pulseDot 1.4s ease-in-out infinite",
              }}
            />
            Simulation Engine Output: {result.total_compromised} Nodes Exposed
          </div>
          <div
            style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}
            className="mono"
          >
            Origin Vector Root Target:{" "}
            <span style={{ color: THEME.text }}>{result.start}</span>
          </div>
        </div>

        {/* Core Timeline Switchers */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => onPlayIndexChange((i) => Math.max(0, i - 1))}
            style={btnStyle}
            title="Previous Step"
          >
            <ControlIcons.Prev />
          </button>
          <button
            onClick={() => onPlayingChange((p) => !p)}
            style={{
              ...btnStyle,
              background: playing ? "#1f2937" : personaColor,
              color: playing ? THEME.text : "#05070c",
              fontWeight: 700,
              borderColor: playing ? THEME.borderAccent : "transparent",
            }}
          >
            {playing ? (
              <>
                <ControlIcons.Pause /> Halt
              </>
            ) : (
              <>
                <ControlIcons.Play /> Execute
              </>
            )}
          </button>
          <button
            onClick={() =>
              onPlayIndexChange((i) => Math.min(hops.length - 1, i + 1))
            }
            style={btnStyle}
            title="Next Step"
          >
            <ControlIcons.Next />
          </button>
          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: THEME.border,
              margin: "0 4px",
            }}
          />
          <button
            onClick={onClose}
            style={{ ...btnStyle, color: THEME.textMuted }}
            title="Close Logs"
          >
            <ControlIcons.Close />
          </button>
        </div>
      </div>

      {/* Main Sequential Simulation Log Output */}
      <div
        style={{ overflowY: "auto", padding: "6px 0" }}
        className="scrollbar-thin"
      >
        {hops.map((h, i) => {
          const active = i === playIndex;
          const done = i < playIndex;
          const stageColor = STAGE_COLOR[h.mitre_stage] || THEME.success;

          return (
            <div
              key={i}
              onClick={() => onPlayIndexChange(i)}
              style={{
                display: "flex",
                gap: 16,
                padding: "12px 20px",
                cursor: "pointer",
                background: active ? `${personaColor}0d` : "transparent",
                borderLeft: `3px solid ${active ? personaColor : done ? THEME.borderAccent : "transparent"}`,
                borderBottom: `1px solid rgba(31, 41, 55, 0.4)`,
                opacity: i > playIndex ? 0.3 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {/* MITRE ATT&CK Stage Badging */}
              <div
                style={{
                  minWidth: 130,
                  maxWidth: 130,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: stageColor,
                  letterSpacing: "0.5px",
                  paddingTop: 2,
                }}
              >
                {h.mitre_stage || "Unknown Phase"}
              </div>

              {/* Step Summary Details */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: THEME.textMuted,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    className="mono"
                    style={{ color: THEME.text, fontWeight: 500 }}
                  >
                    {h.from_label}
                  </span>
                  <span style={{ color: THEME.borderAccent }}>⟶</span>
                  <span
                    className="mono"
                    style={{
                      color: active ? THEME.warning : THEME.text,
                      fontWeight: 600,
                    }}
                  >
                    {h.to_label}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      marginLeft: 4,
                      background: "#1f2937",
                      padding: "1px 5px",
                      borderRadius: 3,
                    }}
                  >
                    port {h.ports?.join(", ")}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    marginTop: 4,
                    color: active ? THEME.text : "#d1d5db",
                    lineHeight: 1.4,
                  }}
                >
                  {h.explanation}
                </div>

                {/* Mitigation Advisory Block */}
                {active && h.recommendation && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      background: `${personaColor}0f`,
                      borderRadius: 4,
                      padding: "10px 14px",
                      color: THEME.text,
                      border: `1px solid ${personaColor}44`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div style={{ marginTop: 2, color: personaColor }}>
                      <ControlIcons.Shield />
                    </div>
                    <div>
                      <strong style={{ color: "#f3f4f6", fontWeight: 600 }}>
                        Recommended Countermeasure:
                      </strong>{" "}
                      {h.recommendation}
                      <span
                        className="mono"
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          color: THEME.success,
                          background: "rgba(16, 185, 129, 0.1)",
                          padding: "1px 4px",
                          borderRadius: 3,
                          fontWeight: 600,
                        }}
                      >
                        -{h.risk_reduction}% Risk Profile
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#1f2937",
  border: `1px solid ${THEME.borderAccent}`,
  color: THEME.text,
  borderRadius: 4,
  padding: "6px 10px",
  fontSize: 11,
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  transition: "all 0.1s ease",
};
