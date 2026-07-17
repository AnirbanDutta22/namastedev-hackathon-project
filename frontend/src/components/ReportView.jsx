import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import Loader from "./Loader";

const STAT_LABELS = {
  total_assets: "Total Assets",
  assets_compromised: "Currently Compromised",
  assets_secured_by_patches: "Secured By Patches",
  exposure_score: "Exposure Score",
};

export default function ReportView({
  open,
  onClose,
  sessionId,
  persona,
  attackResult,
  originalResult,
  hasPatched,
  networkName = "Uploaded Network",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const color = persona?.color || "#ff3b4e";

  useEffect(() => {
    if (!open || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getReport(sessionId, {
        persona: persona?.id,
        attackResult,
        originalResult,
        patched: hasPatched,
        networkName,
      })
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const s = data?.summary;

  return (
    <div
      onClick={onClose}
      className="no-print"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 450,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,7,12,0.8)",
        backdropFilter: "blur(6px)",
        animation: "backdropIn 0.25s ease-out both",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 96vw)",
          height: "min(880px, 92vh)",
          background: "#ffffff",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 40px 100px -30px rgba(0,0,0,0.85), 0 0 0 1px ${color}33`,
          animation: "modalPop 0.45s var(--ease-out) both",
          overflow: "hidden",
        }}
      >
        {/* toolbar (hidden when printing) */}
        <div
          className="no-print"
          style={{
            padding: "14px 22px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8f9fb",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            SECURITY ASSESSMENT REPORT
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.print()}
              disabled={!data}
              style={{
                background: color,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: data ? "pointer" : "default",
                opacity: data ? 1 : 0.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                color: "#6b7280",
                fontSize: 14,
                cursor: "pointer",
                width: 32,
                height: 32,
                borderRadius: 6,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* printable document body */}
        <div
          className="report-printable scrollbar-thin"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "36px 44px",
            color: "#111827",
          }}
        >
          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 60,
              }}
            >
              <Loader
                fullscreen={false}
                color={color}
                messages={[
                  "Assembling report…",
                  "Scoring exposure…",
                  "Formatting for print…",
                ]}
              />
            </div>
          )}

          {error && (
            <div className="mono" style={{ color: "#dc2626", fontSize: 13 }}>
              Error: {error}
            </div>
          )}

          {data && (
            <>
              {/* Document header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 28,
                  borderBottom: "2px solid #111827",
                  paddingBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Attack Simulation Report
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    {data.network_name}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 11.5,
                    color: "#6b7280",
                  }}
                >
                  <div>
                    Generated {new Date(data.generated_at).toLocaleString()}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 700,
                      color,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: color,
                        display: "inline-block",
                      }}
                    />
                    {data.persona.name} — {data.persona.callsign}
                  </div>
                </div>
              </div>

              {/* Executive summary */}
              <div style={{ marginBottom: 30 }}>
                <SectionTitle>Executive Summary</SectionTitle>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {Object.entries(STAT_LABELS).map(([key, label]) => (
                    <div
                      key={key}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 800 }}>
                        {key === "exposure_score" ? `${s[key]}%` : s[key]}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: s.contained ? "#ecfdf5" : "#fef2f2",
                    border: `1px solid ${s.contained ? "#a7f3d0" : "#fecaca"}`,
                    fontSize: 13,
                    color: s.contained ? "#065f46" : "#991b1b",
                  }}
                >
                  {s.contained
                    ? "✓ Fully contained — no assets currently reachable by this attacker."
                    : `⚠ ${s.assets_compromised} of ${s.total_assets} assets currently reachable by ${data.persona.name}.`}
                  {s.patched && s.assets_compromised_before_patch != null && (
                    <span>
                      {" "}
                      Patches applied this session reduced reachable assets from{" "}
                      <strong>
                        {s.assets_compromised_before_patch}
                      </strong> to <strong>{s.assets_compromised}</strong>.
                    </span>
                  )}
                </div>
              </div>

              {/* Attack timeline */}
              <div style={{ marginBottom: 30 }}>
                <SectionTitle>
                  Attack Timeline ({data.attack_timeline.length} hops)
                </SectionTitle>
                {data.attack_timeline.length === 0 ? (
                  <div
                    style={{ fontSize: 13, color: "#6b7280", marginTop: 10 }}
                  >
                    No reachable hops — the attacker is fully contained at the
                    entry point.
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 10,
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1.5px solid #111827",
                          textAlign: "left",
                        }}
                      >
                        <Th>#</Th>
                        <Th>Hop</Th>
                        <Th>MITRE Stage</Th>
                        <Th>Finding</Th>
                        <Th>Recommendation</Th>
                        <Th>Risk ↓</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attack_timeline.map((h) => (
                        <tr
                          key={h.hop_index}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            verticalAlign: "top",
                          }}
                        >
                          <Td>{h.hop_index + 1}</Td>
                          <Td>
                            <strong>{h.from}</strong> → <strong>{h.to}</strong>
                            <div style={{ color: "#9ca3af", fontSize: 10.5 }}>
                              ports {h.ports.join(", ")}
                            </div>
                          </Td>
                          <Td>
                            <span
                              style={{
                                background: "#f3f4f6",
                                padding: "2px 7px",
                                borderRadius: 4,
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              {h.mitre_stage}
                            </span>
                          </Td>
                          <Td style={{ maxWidth: 220 }}>{h.explanation}</Td>
                          <Td style={{ maxWidth: 220 }}>{h.recommendation}</Td>
                          <Td>{h.risk_reduction}%</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Patched hops */}
              {data.patched_hops.length > 0 && (
                <div style={{ marginBottom: 30 }}>
                  <SectionTitle>Patches Applied This Session</SectionTitle>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {data.patched_hops.map((p, i) => (
                      <span
                        key={i}
                        className="mono"
                        style={{
                          fontSize: 11,
                          background: "#ecfdf5",
                          color: "#065f46",
                          border: "1px solid #a7f3d0",
                          borderRadius: 5,
                          padding: "4px 9px",
                        }}
                      >
                        🔒 {p.source} → {p.target}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Asset inventory */}
              <div style={{ marginBottom: 10 }}>
                <SectionTitle>
                  Asset Inventory ({data.asset_inventory.length})
                </SectionTitle>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: 10,
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1.5px solid #111827",
                        textAlign: "left",
                      }}
                    >
                      <Th>Asset</Th>
                      <Th>Type</Th>
                      <Th>IP</Th>
                      <Th>Risk Score</Th>
                      <Th>Criticality</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.asset_inventory.map((n) => (
                      <tr
                        key={n.id}
                        style={{ borderBottom: "1px solid #e5e7eb" }}
                      >
                        <Td>
                          <strong>{n.label}</strong>
                        </Td>
                        <Td>{n.type}</Td>
                        <Td className="mono">{n.ip}</Td>
                        <Td>{n.risk_score}</Td>
                        <Td style={{ textTransform: "capitalize" }}>
                          {n.criticality}
                        </Td>
                        <Td>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background:
                                n.status === "Compromised"
                                  ? "#fef2f2"
                                  : "#f3f4f6",
                              color:
                                n.status === "Compromised"
                                  ? "#991b1b"
                                  : "#374151",
                            }}
                          >
                            {n.status}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  marginTop: 30,
                  paddingTop: 16,
                  borderTop: "1px solid #e5e7eb",
                  fontSize: 10.5,
                  color: "#9ca3af",
                }}
              >
                Generated by an automated attack-path simulation (
                {data.persona.name} doctrine: {data.persona.doctrine}). Findings
                are inferred from network scan data and heuristic trust modeling
                — verify against your actual firewall/ACL configuration before
                acting on any recommendation.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#111827",
      }}
    >
      {children}
    </div>
  );
}
function Th({ children }) {
  return (
    <th
      style={{
        padding: "6px 8px",
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#6b7280",
      }}
    >
      {children}
    </th>
  );
}
function Td({ children, style, ...rest }) {
  return (
    <td style={{ padding: "8px 8px", ...style }} {...rest}>
      {children}
    </td>
  );
}
