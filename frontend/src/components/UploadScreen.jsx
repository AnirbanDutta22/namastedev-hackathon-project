import React from "react";
import BackgroundGraph from "./BackgroundGraph";
import Loader from "./Loader";
import { getPersona } from "../lib/personas";

const LOAD_MESSAGES = [
  "Parsing Nmap XML…",
  "Building node topology…",
  "Inferring trust edges…",
  "Scoring exposure…",
  "Handing off to your attacker…",
];

export default function UploadScreen({
  personaId,
  onLoadDemo,
  onUpload,
  onBack,
  loading,
  error,
}) {
  const persona = getPersona(personaId);

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
      <BackgroundGraph
        seed={41}
        count={22}
        color={persona.color}
        style={{ opacity: 0.3 }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
        }}
      >
        <button
          onClick={onBack}
          className="mono"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-dim)",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          CHANGE ATTACKER
        </button>
        <span
          className="display"
          style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.08em" }}
        >
          Pentest&nbsp;AI
        </span>
      </div>

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
          className="anim-scale-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 14px",
            borderRadius: 999,
            border: `1px solid ${persona.color}55`,
            background: `${persona.color}14`,
            marginBottom: 26,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: `${persona.color}22`,
              color: persona.color,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {persona.glyph}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: persona.color,
              letterSpacing: "0.1em",
              fontWeight: 700,
            }}
          >
            {persona.name.toUpperCase()} — {persona.callsign}
          </span>
        </div>

        <div
          className="mono anim-fade-up"
          style={{
            fontSize: 11,
            color: "var(--text-dim)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Step 2 of 2 — Feed It A Network
        </div>

        <h1
          className="display anim-fade-up"
          style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            margin: "0 0 14px",
            fontWeight: 700,
            maxWidth: 680,
            lineHeight: 1.08,
            animationDelay: "0.06s",
          }}
        >
          Give {persona.name} something to break into.
        </h1>
        <p
          className="anim-fade-up"
          style={{
            color: "var(--text-muted)",
            maxWidth: 520,
            marginBottom: 40,
            fontSize: 14.5,
            lineHeight: 1.6,
            animationDelay: "0.12s",
          }}
        >
          Upload a real Nmap XML scan of your infrastructure, or load the demo
          network to see {persona.name} in action immediately.
        </p>

        <div
          className="anim-fade-up"
          style={{
            display: "flex",
            gap: 12,
            animationDelay: "0.2s",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <label className="btn-signal" style={{ margin: 0 }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload Nmap Scan (XML)
            <input
              type="file"
              accept=".xml"
              style={{ display: "none" }}
              onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
            />
          </label>
          <button onClick={onLoadDemo} className="btn-ghost">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run Demo Network
          </button>
        </div>

        {error && (
          <div
            className="mono anim-fade-in"
            style={{ marginTop: 22, color: "#ff5c5c", fontSize: 12 }}
          >
            Error: {error}
          </div>
        )}
      </div>

      {loading && (
        <Loader
          messages={LOAD_MESSAGES}
          color={persona.color}
          label={`${persona.name.toUpperCase()} INITIALIZING`}
        />
      )}
    </div>
  );
}
