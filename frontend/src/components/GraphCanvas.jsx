import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "reactflow";

// Enterprise Theme Tokens
const THEME = {
  canvasBg: "#070a13",
  nodeBg: "#111827",
  border: "#1f2937",
  borderAccent: "#374151",
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  accent: "#3b82f6", // Enterprise Blue
  danger: "#ef4444", // Threat Red
  warning: "#f59e0b", // Alert Amber
  success: "#10b981", // Secure Green
};

const NodeIcons = {
  Internet: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  "Web Server": () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  "API Server": () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Database: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  Redis: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Server: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="2" y1="15" x2="22" y2="15" />
    </svg>
  ),
  Workstation: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Switch: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="22" y1="12" x2="2" y2="12" />
    </svg>
  ),
};

function riskColor(score) {
  if (score >= 60) return THEME.danger;
  if (score >= 35) return THEME.warning;
  if (score >= 15) return "#efd154";
  return THEME.success;
}

function layoutNodes(nodes) {
  const layers = [
    "Internet",
    "Web Server",
    "API Server",
    "Server",
    "Redis",
    "Database",
    "Workstation",
    "Switch",
  ];
  const grouped = {};
  nodes.forEach((n) => {
    const layer = layers.includes(n.type) ? n.type : "Server";
    grouped[layer] = grouped[layer] || [];
    grouped[layer].push(n);
  });

  const positioned = [];
  layers.forEach((layer, li) => {
    const group = grouped[layer] || [];
    group.forEach((n, i) => {
      // Extended spatial separation to clear linear stacking
      positioned.push({ ...n, x: 80 + li * 310, y: 120 + i * 200 });
    });
  });
  return positioned;
}

export default function GraphCanvas({
  graph,
  onNodeClick,
  selectedNodeId,
  activePathEdges = new Set(),
  compromisedNodes = new Set(),
}) {
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!graph) return { rfNodes: [], rfEdges: [] };
    const positioned = layoutNodes(graph.nodes);

    // Check if an attack sequence simulation is currently rendered active
    const isAnySimulationActive = activePathEdges.size > 0;

    const rfNodes = positioned.map((n) => {
      const isCompromised = compromisedNodes.has(n.id);
      const isSelected = n.id === selectedNodeId;

      const baseRiskColor =
        n.id === "internet" ? THEME.accent : riskColor(n.risk_score || 0);
      const nodeBorderColor = isCompromised
        ? THEME.danger
        : isSelected
          ? THEME.accent
          : baseRiskColor;
      const nodeBgColor = isCompromised
        ? "rgba(239, 68, 68, 0.12)"
        : THEME.nodeBg;

      const IconComponent =
        NodeIcons[n.type] ||
        (() => (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        ));

      return {
        id: n.id,
        position: { x: n.x, y: n.y },
        // Elevate compromised or selected nodes structurally
        zIndex: isCompromised ? 110 : isSelected ? 120 : 10,
        data: {
          label: (
            <div
              style={{ textAlign: "left", fontFamily: "system-ui, sans-serif" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                  color: isCompromised ? THEME.danger : THEME.textMuted,
                }}
              >
                <IconComponent />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  {n.type}
                </span>
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: THEME.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {n.label}
              </div>
              {n.id !== "internet" && (
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: THEME.textMuted,
                    marginTop: 4,
                    opacity: 0.85,
                  }}
                >
                  {n.ip}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: nodeBgColor,
          borderColor: nodeBorderColor,
          borderWidth: isCompromised || isSelected ? "2px" : "1px",
          borderStyle: "solid",
          borderRadius: 6,
          padding: "12px 14px",
          color: THEME.text,
          width: 190,
          opacity: isCompromised || !isAnySimulationActive ? 1 : 0.4, // Subtly step back safe nodes during simulation
          boxShadow: isCompromised
            ? "0 0 22px rgba(239, 68, 68, 0.45), inset 0 0 6px rgba(239, 68, 68, 0.15)"
            : isSelected
              ? `0 0 0 3px rgba(59, 130, 246, 0.3)`
              : "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
          transition: "all 0.2s ease-in-out",
        },
      };
    });

    const rfEdges = graph.edges.map((e, i) => {
      const key = `${e.source}->${e.target}`;
      const active = activePathEdges.has(key);

      return {
        id: `${key}-${i}`,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        borderRadius: 8,
        animated: active,
        // Force the exploit line to pop above parallel overlapping paths
        zIndex: active ? 2000 : 10,
        // Hide port configurations text tags on unsimulated background lanes
        label:
          isAnySimulationActive && !active ? "" : e.ports?.join(", ") || "",
        labelBgStyle: {
          fill: THEME.canvasBg,
          stroke: active ? THEME.danger : THEME.borderAccent,
          strokeWidth: 1,
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 4],
        labelStyle: {
          fill: active ? THEME.danger : THEME.textMuted,
          fontSize: 9,
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 600,
        },
        style: {
          stroke: active
            ? THEME.danger
            : e.trust === "untrusted"
              ? "#4b5563"
              : "#1f2937",
          strokeWidth: active ? 3.5 : 1.25, // Thicker structural line for the active exploit vector
          // Drastically fade out static edges down to 12% opacity to let active paths glow clearly
          opacity: active ? 1 : isAnySimulationActive ? 0.12 : 1,
          transition: "all 0.2s ease-in-out",
        },
        // Enforce hard directional vector arrow pointing directly to the target node
        markerEnd: active
          ? {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: THEME.danger,
            }
          : undefined,
      };
    });

    return { rfNodes, rfEdges };
  }, [graph, selectedNodeId, activePathEdges, compromisedNodes]);

  if (!graph) return null;

  return (
    <div
      style={{ width: "100%", height: "100%", backgroundColor: THEME.canvasBg }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#1e293b"
          gap={24}
          size={1}
          variant="dots"
          opacity={0.3}
        />
        <Controls
          style={{
            filter: "invert(0.9) grayscale(1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
          }}
        />
        <MiniMap
          style={{
            background: THEME.nodeBg,
            border: `1px solid ${THEME.border}`,
          }}
          nodeColor={(node) => node.style?.borderColor || THEME.accent}
          maskColor="rgba(7, 10, 19, 0.75)"
        />
      </ReactFlow>
    </div>
  );
}
