import React from "react";

// ---------------------------------------------------------------------
// AttackerAvatar3D
//
// Each persona gets a procedurally-built "attacker bust" — a hooded
// silhouette rendered as several *separate* stacked SVG layers (glow,
// rotating rings, body, particles, scanline). Because each layer is its
// own element with its own translateZ inside a shared preserve-3d parent,
// tilting the parent card via mouse movement makes the layers visibly
// separate in depth, like a real holographic ID rather than a flat photo.
//
// No real faces/photos are used (avoids likeness issues and keeps every
// persona visually consistent with its doctrine) — instead each persona
// reads through silhouette + visor treatment + material behavior:
//   RED (Breacher)    - cracked, jagged visor, hard glitch jolts
//   BLUE (Ghost)       - translucent wireframe, low-opacity flicker
//   INSIDER (Mole)     - half solid / half wireframe split, ID badge glint
// ---------------------------------------------------------------------

const HOOD_PATH =
  "M100,18 C64,18 44,48 44,86 C44,108 54,124 66,134 L58,150 " +
  "C34,160 16,182 10,214 L190,214 C184,182 166,160 142,150 " +
  "L134,134 C146,124 156,108 156,86 C156,48 136,18 100,18 Z";

const PARTICLES = [
  { cx: 30, cy: 70, r: 1.6, delay: 0 },
  { cx: 172, cy: 60, r: 1.3, delay: 0.6 },
  { cx: 22, cy: 150, r: 1.1, delay: 1.1 },
  { cx: 180, cy: 140, r: 1.7, delay: 1.7 },
  { cx: 100, cy: 12, r: 1.2, delay: 0.3 },
  { cx: 60, cy: 195, r: 1.4, delay: 2.1 },
  { cx: 145, cy: 190, r: 1.2, delay: 1.4 },
];

function VisorRed({ color, uid }) {
  return (
    <g>
      <path
        d="M62,94 L88,103 L76,109 L114,126 L98,113 L138,98 L106,97 L120,86 L86,91 Z"
        fill={color}
        opacity="0.95"
        filter={`url(#glow-${uid})`}
      />
      {[
        [100, 106, 68, 78],
        [100, 106, 134, 80],
        [100, 106, 58, 128],
        [100, 106, 142, 124],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="1"
          opacity="0.55"
        />
      ))}
    </g>
  );
}

function VisorBlue({ color, uid }) {
  return (
    <g>
      <rect
        x="58"
        y="97"
        width="84"
        height="9"
        rx="2"
        fill={color}
        opacity="0.85"
        filter={`url(#glow-${uid})`}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={62 + i * 13}
          y="97"
          width="6"
          height="9"
          fill="#05070c"
          opacity="0.55"
        />
      ))}
    </g>
  );
}

function VisorInsider({ color, uid }) {
  return (
    <g>
      {/* trusted half */}
      <ellipse cx="78" cy="100" rx="16" ry="6" fill={color} opacity="0.9" />
      {/* glitching wireframe half */}
      <g opacity="0.9">
        <rect
          x="106"
          y="94"
          width="34"
          height="14"
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
        <line
          x1="106"
          y1="98"
          x2="140"
          y2="98"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.7"
        />
        <line
          x1="106"
          y1="104"
          x2="140"
          y2="104"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.7"
        />
        <line
          x1="114"
          y1="94"
          x2="114"
          y2="108"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.5"
        />
        <line
          x1="126"
          y1="94"
          x2="126"
          y2="108"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.5"
        />
      </g>
      {/* ID badge on chest */}
      <g transform="translate(84,168)">
        <rect
          x="0"
          y="0"
          width="30"
          height="20"
          rx="2"
          fill="#0d1119"
          stroke={color}
          strokeWidth="1"
        />
        <circle cx="8" cy="7" r="3" fill={color} opacity="0.8" />
        <line
          x1="15"
          y1="5"
          x2="26"
          y2="5"
          stroke={color}
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1="15"
          y1="9"
          x2="26"
          y2="9"
          stroke={color}
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1="4"
          y1="15"
          x2="26"
          y2="15"
          stroke={color}
          strokeWidth="0.7"
          opacity="0.4"
        />
      </g>
    </g>
  );
}

const VISOR_BY_PERSONA = {
  red: VisorRed,
  blue: VisorBlue,
  insider: VisorInsider,
};

export default function AttackerAvatar3D({
  personaId,
  color,
  active = false,
  size = 176,
}) {
  const uid = personaId;
  const Visor = VISOR_BY_PERSONA[personaId] || VisorRed;
  const isBlue = personaId === "blue";
  const isInsider = personaId === "insider";

  return (
    <div
      className="avatar3d-stack"
      style={{
        width: size,
        height: size * 1.18,
        position: "relative",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Layer 0 — ambient glow orb, deepest */}
      <svg
        viewBox="0 0 200 220"
        className="avatar3d-layer"
        style={{ transform: "translateZ(-46px) scale(1.15)" }}
      >
        <defs>
          <radialGradient id={`orb-${uid}`} cx="50%" cy="46%" r="55%">
            <stop
              offset="0%"
              stopColor={color}
              stopOpacity={active ? 0.55 : 0.32}
            />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill={`url(#orb-${uid})`} />
      </svg>

      {/* Layer 1 — rotating circuit rings */}
      <svg
        viewBox="0 0 200 220"
        className="avatar3d-layer avatar3d-rings"
        style={{ transform: "translateZ(-24px)" }}
      >
        <g
          style={{ transformOrigin: "100px 108px" }}
          className="avatar3d-ring-spin"
        >
          <circle
            cx="100"
            cy="108"
            r="88"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.28"
            strokeDasharray="2 10"
          />
        </g>
        <g
          style={{ transformOrigin: "100px 108px" }}
          className="avatar3d-ring-spin-rev"
        >
          <circle
            cx="100"
            cy="108"
            r="76"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.18"
            strokeDasharray="1 7"
          />
        </g>
      </svg>

      {/* Layer 2 — the body/silhouette itself */}
      <svg
        viewBox="0 0 200 220"
        className="avatar3d-layer"
        style={{ transform: "translateZ(0px)" }}
      >
        <defs>
          <clipPath id={`clip-${uid}`}>
            <path d={HOOD_PATH} />
          </clipPath>
          <filter
            id={`glow-${uid}`}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#161d2b" />
            <stop offset="100%" stopColor="#0a0d14" />
          </linearGradient>
        </defs>

        <path
          d={HOOD_PATH}
          fill={isBlue ? "rgba(15,20,32,0.35)" : `url(#body-${uid})`}
          stroke={color}
          strokeWidth={isBlue ? 1.1 : 1.4}
          opacity={isBlue ? 0.85 : 1}
        />

        {/* fine hood contour lines for material detail */}
        <path
          d="M70,50 C64,64 62,78 66,96"
          fill="none"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.28"
        />
        <path
          d="M130,50 C136,64 138,78 134,96"
          fill="none"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.28"
        />

        <g clipPath={`url(#clip-${uid})`}>
          <Visor color={color} uid={uid} />
        </g>

        {isInsider && (
          <g
            clipPath={`url(#clip-${uid})`}
            className="avatar3d-insider-split"
            opacity="0.5"
          >
            <rect
              x="100"
              y="18"
              width="60"
              height="196"
              fill={color}
              opacity="0.05"
            />
          </g>
        )}
      </svg>

      {/* Layer 3 — floating particulate motes, above the body */}
      <svg
        viewBox="0 0 200 220"
        className="avatar3d-layer"
        style={{ transform: "translateZ(26px)" }}
      >
        {PARTICLES.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={color}
            className="avatar3d-particle"
            style={{ animationDelay: `${p.delay}s` }}
          />
        ))}
      </svg>

      {/* Layer 4 — scanline sweep clipped to the silhouette, nearest the glass */}
      <svg
        viewBox="0 0 200 220"
        className="avatar3d-layer"
        style={{ transform: "translateZ(34px)" }}
      >
        <defs>
          <clipPath id={`clip2-${uid}`}>
            <path d={HOOD_PATH} />
          </clipPath>
          <linearGradient id={`scan-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#clip2-${uid})`}>
          <rect
            x="0"
            y="0"
            width="200"
            height="46"
            fill={`url(#scan-${uid})`}
            className="avatar3d-scan"
          />
        </g>
      </svg>
    </div>
  );
}
