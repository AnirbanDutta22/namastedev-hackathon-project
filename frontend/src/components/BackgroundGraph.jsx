import React, { useMemo } from "react";

// Signature visual: a quiet, ambient version of the exact same node/edge
// graph the product itself renders once you're inside the console. It's the
// one place in the design where we let the "attack path" idea breathe as
// pure atmosphere before the user has uploaded anything.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function BackgroundGraph({
  count = 26,
  seed = 7,
  color = "var(--signal)",
  width = 1200,
  height = 800,
  className,
  style,
}) {
  const { nodes, edges, activeEdges } = useMemo(() => {
    const rand = seededRandom(seed);
    const nodes = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rand() * width,
      y: rand() * height,
      r: 1.6 + rand() * 2.2,
      delay: rand() * 4,
    }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 190 && rand() > 0.62) {
          edges.push({ a: nodes[i], b: nodes[j], dist });
        }
      }
    }
    // pick a handful of edges to "flow" — the attack-path signature
    const activeEdges = edges
      .slice()
      .sort(() => rand() - 0.5)
      .slice(0, Math.max(2, Math.floor(edges.length * 0.08)));

    return { nodes, edges, activeEdges };
  }, [count, seed, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bg-node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {edges.map((e, i) => (
        <line
          key={`e-${i}`}
          x1={e.a.x}
          y1={e.a.y}
          x2={e.b.x}
          y2={e.b.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {activeEdges.map((e, i) => (
        <line
          key={`ae-${i}`}
          x1={e.a.x}
          y1={e.a.y}
          x2={e.b.x}
          y2={e.b.y}
          stroke={color}
          strokeWidth="1.4"
          strokeOpacity="0.55"
          strokeDasharray="4 10"
          style={{ animation: `dashFlow ${5 + (i % 4)}s linear infinite` }}
        />
      ))}

      {nodes.map((n) => (
        <g
          key={n.id}
          style={{
            animation: `glowPulse ${3 + n.delay}s ease-in-out infinite`,
            animationDelay: `${n.delay}s`,
          }}
        >
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r * 6}
            fill="url(#bg-node-glow)"
            opacity="0.35"
          />
          <circle cx={n.x} cy={n.y} r={n.r} fill={color} opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
