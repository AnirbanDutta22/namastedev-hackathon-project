import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "reactflow";

const THEME = {
  canvasBg: "#070a11",
  nodeBg: "#0d1119",
  border: "#1c222f",
  borderAccent: "#2a3242",
  text: "#edf1f7",
  textMuted: "#7c8698",
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
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
  personaColor = "#ff3b4e",
}) {
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!graph) return { rfNodes: [], rfEdges: [] };
    const positioned = layoutNodes(graph.nodes);
    const isAnySimulationActive = activePathEdges.size > 0;

    const rfNodes = positioned.map((n) => {
      const isCompromised = compromisedNodes.has(n.id);
      const isSelected = n.id === selectedNodeId;

      const baseRiskColor =
        n.id === "internet" ? personaColor : riskColor(n.risk_score || 0);
      const nodeBorderColor = isCompromised
        ? personaColor
        : isSelected
          ? personaColor
          : baseRiskColor;
      const nodeBgColor = isCompromised ? `${personaColor}1f` : THEME.nodeBg;

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
        zIndex: isCompromised ? 110 : isSelected ? 120 : 10,
        data: {
          label: (
            <div
              style={{
                textAlign: "left",
                fontFamily: "var(--font-ui)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isCompromised && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "40%",
                    background: `linear-gradient(to bottom, transparent, ${personaColor}33, transparent)`,
                    animation: "scanSweep 2.2s linear infinite",
                    pointerEvents: "none",
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                  color: isCompromised ? personaColor : THEME.textMuted,
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
                {isCompromised && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: personaColor,
                      animation: "pulseDot 1s ease-in-out infinite",
                    }}
                  />
                )}
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
          borderRadius: 7,
          padding: "12px 14px",
          color: THEME.text,
          width: 190,
          opacity: isCompromised || !isAnySimulationActive ? 1 : 0.35,
          boxShadow: isCompromised
            ? `0 0 26px ${personaColor}55, inset 0 0 8px ${personaColor}22`
            : isSelected
              ? `0 0 0 3px ${personaColor}44`
              : "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
          transition: "all 0.25s ease-in-out",
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
        borderRadius: 10,
        animated: false,
        zIndex: active ? 2000 : 10,
        label:
          isAnySimulationActive && !active ? "" : e.ports?.join(", ") || "",
        labelBgStyle: {
          fill: THEME.canvasBg,
          stroke: active ? personaColor : THEME.borderAccent,
          strokeWidth: 1,
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 4],
        labelStyle: {
          fill: active ? personaColor : THEME.textMuted,
          fontSize: 9,
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 600,
        },
        style: {
          stroke: active
            ? personaColor
            : e.trust === "untrusted"
              ? "#4b5563"
              : "#1f2937",
          strokeWidth: active ? 3 : 1.25,
          strokeDasharray: active ? "6 6" : undefined,
          animation: active ? "dashFlow 1.1s linear infinite" : undefined,
          opacity: active ? 1 : isAnySimulationActive ? 0.1 : 1,
          filter: active ? `drop-shadow(0 0 6px ${personaColor}aa)` : undefined,
          transition: "opacity 0.25s ease-in-out, stroke 0.25s ease-in-out",
        },
        markerEnd: active
          ? {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: personaColor,
            }
          : undefined,
      };
    });

    return { rfNodes, rfEdges };
  }, [graph, selectedNodeId, activePathEdges, compromisedNodes, personaColor]);

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
          nodeColor={(node) => node.style?.borderColor || personaColor}
          maskColor="rgba(7, 10, 19, 0.75)"
        />
      </ReactFlow>
    </div>
  );
}
