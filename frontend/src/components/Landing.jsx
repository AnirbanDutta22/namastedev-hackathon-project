import React from "react";
import BackgroundGraph from "./BackgroundGraph";

const HEADLINE = ["SEE THE", "BREACH", "BEFORE", "IT HAPPENS."];

const TICKER_ITEMS = [
  "NMAP XML",
  "LIVE ATTACK GRAPH",
  "THREE ATTACKER MINDS",
  "MITRE ATT&CK MAPPED",
  "GEMINI-POWERED NARRATION",
  "ONE-CLICK REMEDIATION",
];

const FEATURES = [
  {
    label: "Three attacker personas",
    desc: "Red, Blue, Insider — each thinks differently",
  },
  {
    label: "Real Nmap scans",
    desc: "Parses live XML into a typed topology graph",
  },
  {
    label: "MITRE ATT&CK mapped",
    desc: "Every hop tagged with a real technique stage",
  },
];

export default function Landing({ onEnter }) {
  return (
    <div
      className="hud-grid"
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <BackgroundGraph seed={11} count={30} style={{ opacity: 0.55 }} />

      {/* radial vignette so the graph never fights the text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(5,7,12,0.2) 0%, var(--bg) 72%)",
        }}
      />

      {/* scanline sweep -- signature load-in moment */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "30%",
          background:
            "linear-gradient(to bottom, transparent, var(--signal-soft) 45%, transparent)",
          animation: "scanSweep 1.8s var(--ease-out) 1",
          pointerEvents: "none",
        }}
      />

      {/* nav */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "26px 32px",
        }}
        className="anim-fade-up"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 9,
              height: 9,
              background: "var(--signal)",
              display: "inline-block",
              animation: "pulseDot 1.6s ease-in-out infinite",
            }}
          />
          <span
            className="display"
            style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.08em" }}
          >
            NETTWIN&nbsp;AI
          </span>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--text-dim)",
            letterSpacing: "0.08em",
          }}
        >
          HACKATHON BUILD // ATTACK PATH SIMULATOR
        </div>
      </div>

      {/* hero */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div
          className="mono anim-fade-up"
          style={{
            fontSize: 11,
            color: "var(--signal)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 20,
            animationDelay: "0.05s",
          }}
        >
          Attack Surface Topology Engine
        </div>

        <h1
          className="display"
          style={{
            margin: 0,
            fontSize: "clamp(40px, 8vw, 92px)",
            lineHeight: 0.98,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            maxWidth: 980,
          }}
        >
          {HEADLINE.map((word, i) => (
            <span
              key={word}
              className="anim-fade-up"
              style={{
                display: "inline-block",
                marginRight: "0.28em",
                animationDelay: `${0.12 + i * 0.09}s`,
                color: i === 1 ? "var(--signal)" : "var(--text)",
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        <p
          className="anim-fade-up"
          style={{
            marginTop: 26,
            maxWidth: 560,
            color: "var(--text-muted)",
            fontSize: 16,
            lineHeight: 1.6,
            animationDelay: "0.48s",
          }}
        >
          Upload an Nmap scan. Pick an attacker mind. Watch it reason, hop by
          hop, through your infrastructure — narrated live, mapped to MITRE
          ATT&amp;CK, before a real one ever gets the chance.
        </p>

        <div
          className="anim-fade-up"
          style={{
            marginTop: 40,
            display: "flex",
            gap: 14,
            animationDelay: "0.6s",
          }}
        >
          <button className="btn-signal" onClick={onEnter}>
            Begin Simulation
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        <div
          className="anim-fade-up"
          style={{
            marginTop: 56,
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            justifyContent: "center",
            animationDelay: "0.72s",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.label} style={{ textAlign: "left", maxWidth: 200 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 3,
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-dim)",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ticker */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          borderTop: "1px solid var(--border-soft)",
          padding: "14px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            animation: "marquee 26s linear infinite",
          }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span
              key={i}
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--text-dim)",
                marginRight: 28,
                display: "inline-flex",
                alignItems: "center",
                gap: 28,
              }}
            >
              {t}
              <span style={{ color: "var(--signal)" }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
