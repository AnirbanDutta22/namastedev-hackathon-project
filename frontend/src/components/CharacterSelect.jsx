import React, { useState } from "react";
import { PERSONAS } from "../lib/personas";
import BackgroundGraph from "./BackgroundGraph";
import AttackerAvatar3D from "./AttackerAvatar3D";
import TiltCard from "./TiltCard";
import "./characterSelect3d.css";

export default function CharacterSelect({ onSelect, onBack }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const active = hovered || selected;

  return (
    <div
      className="hud-grid"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <BackgroundGraph
        seed={23}
        count={20}
        color={
          active
            ? PERSONAS.find((p) => p.id === active)?.color
            : "var(--signal)"
        }
        style={{ opacity: 0.25, transition: "opacity 0.4s" }}
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
          BACK
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
          padding: "20px 24px 60px",
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
            marginBottom: 14,
          }}
        >
          Step 1 of 2 — Choose Your Attacker
        </div>
        <h2
          className="display anim-fade-up"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            margin: "0 0 8px",
            fontWeight: 700,
            textAlign: "center",
            animationDelay: "0.06s",
          }}
        >
          Three minds. Same network.
        </h2>
        <p
          className="anim-fade-up"
          style={{
            color: "var(--text-muted)",
            fontSize: 14.5,
            maxWidth: 520,
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: 28,
            animationDelay: "0.12s",
          }}
        >
          Every persona traverses your topology with a different doctrine — and
          narrates the compromise in its own voice.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(272px, 1fr))",
            gap: 28,
            width: "100%",
            maxWidth: 980,
          }}
        >
          {PERSONAS.map((p, i) => {
            const isSelected = selected === p.id;
            const isActive = active === p.id;
            const isDimmed = Boolean(active) && !isActive;
            return (
              <div
                key={p.id}
                className="anim-fade-up"
                style={{ animationDelay: `${0.18 + i * 0.08}s` }}
              >
                <TiltCard
                  personaId={p.id}
                  isActive={isSelected}
                  isDimmed={isDimmed}
                  onEnter={() => setHovered(p.id)}
                  onLeave={() => setHovered(null)}
                  onClick={() => setSelected(p.id)}
                  floatDelay={i * 0.5}
                  style={{
                    padding: "10px 24px 28px",
                    background: isSelected ? `${p.color}14` : "var(--panel)",
                    border: `1px solid ${isSelected ? p.color : "var(--border)"}`,
                    boxShadow: isSelected
                      ? `0 16px 40px -14px ${p.color}55`
                      : "0 8px 24px -16px rgba(0,0,0,0.6)",
                    textAlign: "center",
                  }}
                >
                  <div className="avatar3d-stage">
                    <AttackerAvatar3D
                      personaId={p.id}
                      color={p.color}
                      active={isActive || isSelected}
                    />
                  </div>

                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: p.color,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      marginBottom: 6,
                    }}
                  >
                    {p.callsign}
                  </div>
                  <div
                    className="display"
                    style={{ fontSize: 21, fontWeight: 600, marginBottom: 4 }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      marginBottom: 14,
                    }}
                  >
                    {p.tagline}
                  </div>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "var(--text-dim)",
                      lineHeight: 1.2,
                      margin: 0,
                      minHeight: 60,
                    }}
                  >
                    {p.doctrine}
                  </p>
                  <div
                    style={{
                      marginTop: 0,
                      paddingTop: 14,
                      borderTop: "1px solid var(--border-soft)",
                      fontSize: 11,
                      color: p.color,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: p.color,
                        display: "inline-block",
                      }}
                    />
                    {p.trait}
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: p.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#05070c"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </TiltCard>
              </div>
            );
          })}
        </div>

        <button
          className="btn-signal anim-fade-up"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          style={{
            marginTop: 24,
            opacity: selected ? 1 : 0.35,
            pointerEvents: selected ? "auto" : "none",
            animationDelay: "0.4s",
          }}
        >
          {selected
            ? `Deploy ${PERSONAS.find((p) => p.id === selected).name}`
            : "Select a persona"}
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
    </div>
  );
}
