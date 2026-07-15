import React from "react";

// Layout Design Tokens
const BADGE_COLORS = {
  Critical: {
    text: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
  },
  High: {
    text: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
  },
  Medium: {
    text: "#f5d76e",
    bg: "rgba(245, 215, 110, 0.1)",
    border: "rgba(245, 215, 110, 0.25)",
  },
  Low: {
    text: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
  },
};

function getRiskTheme(score) {
  if (score >= 60) return BADGE_COLORS.Critical;
  if (score >= 35) return BADGE_COLORS.High;
  if (score >= 15) return BADGE_COLORS.Medium;
  return BADGE_COLORS.Low;
}

export default function DeviceSidebar({
  node,
  onSimulate,
  onIsolate,
  personaColor = "#ef4444",
}) {
  if (!node) {
    return (
      <div
        style={{
          padding: 24,
          color: "#9ca3af",
          fontSize: 12,
          textAlign: "center",
          marginTop: 40,
        }}
      >
        Select a node element inside the workspace graph to inspect parameters.
      </div>
    );
  }

  const riskTheme = getRiskTheme(node.risk_score || 0);
  const isInternet = node.id === "internet";

  return (
    <div
      style={{
        padding: 20,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      className="scrollbar-thin"
    >
      {/* Category Type */}
      <div
        style={{
          fontSize: 10,
          color: "#9ca3af",
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {node.type || "ASSET"}
      </div>

      {/* Asset Title */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginTop: 4,
          color: "#f3f4f6",
          letterSpacing: "-0.3px",
        }}
      >
        {node.label}
      </div>

      {/* Node Identifiers */}
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginTop: 4,
          background: "#1f2937",
          padding: "4px 8px",
          borderRadius: 4,
          display: "inline-block",
        }}
      >
        IP: {node.ip || "0.0.0.0"}
      </div>

      {/* Threat Matrix Indicator */}
      <div
        style={{
          marginTop: 20,
          borderTop: "1px solid #1f2937",
          paddingTop: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#9ca3af",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Threat Index
          </span>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              color: riskTheme.text,
              backgroundColor: riskTheme.bg,
              border: `1px solid ${riskTheme.border}`,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {node.risk_score || 0}% Score
          </div>
        </div>
      </div>

      {/* Metadata Structured Table */}
      <div style={{ marginTop: 24 }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <tbody>
            <tr style={{ borderBottom: "1px solid #1f2937" }}>
              <td style={{ padding: "8px 0", color: "#9ca3af" }}>OS System</td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right",
                  fontWeight: 500,
                  color: "#f3f4f6",
                }}
              >
                {node.os || "Unknown OS"}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #1f2937" }}>
              <td style={{ padding: "8px 0", color: "#9ca3af" }}>
                Asset Criticality
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right",
                  fontWeight: 500,
                  color: "#f3f4f6",
                }}
              >
                {node.criticality || "Undefined"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Open Port Matrix Grid */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontSize: 10,
            color: "#9ca3af",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Exposed Interface Ports
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
        >
          {(node.open_ports || []).length === 0 ? (
            <span
              style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}
            >
              No active ports detected
            </span>
          ) : (
            (node.open_ports || []).map((p) => (
              <span
                key={p.port}
                className="mono"
                style={{
                  fontSize: 10,
                  background: "#1f2937",
                  border: "1px solid #374151",
                  color: "#f3f4f6",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontWeight: 500,
                }}
              >
                {p.port}/{p.protocol.toUpperCase()}{" "}
                <span style={{ color: "#9ca3af" }}>({p.service})</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Operational Actions Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 28,
          borderTop: "1px solid #1f2937",
          paddingTop: 20,
        }}
      >
        <button
          onClick={() => onSimulate(node.id)}
          style={{
            background: personaColor,
            color: "#05070c",
            border: "none",
            borderRadius: 4,
            padding: "10px 14px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            transition: "filter 0.15s",
            textTransform: "uppercase",
            letterSpacing: "0.2px",
          }}
          onMouseOver={(e) => (e.target.style.filter = "brightness(1.12)")}
          onMouseOut={(e) => (e.target.style.filter = "none")}
        >
          Simulate Attack Sequence
        </button>
        {!isInternet && (
          <button
            onClick={() => onIsolate(node.id)}
            style={{
              background: "transparent",
              color: "#3b82f6",
              border: "1px solid #3b82f6",
              borderRadius: 4,
              padding: "9px 14px",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
              textTransform: "uppercase",
              letterSpacing: "0.2px",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(59, 130, 246, 0.1)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Quarantine Asset (Isolate)
          </button>
        )}
      </div>
    </div>
  );
}
