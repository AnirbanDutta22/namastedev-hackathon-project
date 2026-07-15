import React, { useMemo, useState } from "react";
import GraphCanvas from "./components/GraphCanvas";
import DeviceSidebar from "./components/DeviceSidebar";
import AttackPanel from "./components/AttackPanel";
import ChatPanel from "./components/ChatPanel";
import { api } from "./lib/api";

// Design Tokens
const THEME = {
  bg: "#090d16",
  panel: "#111827",
  panelHeader: "#0d131f",
  border: "#1f2937",
  borderAccent: "#374151",
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  accent: "#3b82f6", // Enterprise Blue
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
};

// Inline SVGs for clean, professional iconography
const Icons = {
  Logo: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={THEME.accent}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Chat: () => (
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Refresh: () => (
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
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  Upload: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  Demo: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [graph, setGraph] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [playIndex, setPlayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedNodeId) || null,
    [graph, selectedNodeId],
  );

  async function handleLoadDemo() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loadDemo();
      setSessionId(res.session_id);
      setGraph(res.graph);
      setAttackResult(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadScan(file);
      setSessionId(res.session_id);
      setGraph(res.graph);
      setAttackResult(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate(nodeId) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulate(sessionId, nodeId);
      setAttackResult(res);
      setPlayIndex(0);
      setPlaying(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleIsolate(nodeId) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.scenario(sessionId, "isolate_node", {
        node_id: nodeId,
      });
      setGraph(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const { activePathEdges, compromisedNodes } = useMemo(() => {
    const edges = new Set();
    const nodes = new Set();
    if (attackResult) {
      nodes.add(attackResult.start);
      attackResult.hops.slice(0, playIndex + 1).forEach((h) => {
        edges.add(`${h.from}->${h.to}`);
        nodes.add(h.to);
      });
    }
    return { activePathEdges: edges, compromisedNodes: nodes };
  }, [attackResult, playIndex]);

  if (!graph) {
    return (
      <LandingScreen
        onLoadDemo={handleLoadDemo}
        onUpload={handleUpload}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: THEME.bg,
        color: THEME.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.panelHeader,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icons.Logo />
          <span
            style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.2px" }}
          >
            NetTwin Console
          </span>
          <div
            style={{ height: 16, width: 1, backgroundColor: THEME.border }}
          />
          <span
            className="mono"
            style={{ fontSize: 11, color: THEME.textMuted }}
          >
            {graph.nodes.length - 1} nodes • {graph.edges.length} connections
            detected
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setChatOpen((v) => !v)} style={headerBtn}>
            <Icons.Chat /> AI Copilot
          </button>
          <button
            onClick={() => {
              setGraph(null);
              setSessionId(null);
              setAttackResult(null);
            }}
            style={headerBtn}
          >
            <Icons.Refresh /> Reset Session
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 320,
            borderRight: `1px solid ${THEME.border}`,
            background: THEME.panel,
          }}
        >
          <DeviceSidebar
            node={selectedNode}
            onSimulate={handleSimulate}
            onIsolate={handleIsolate}
          />
        </div>

        <div style={{ flex: 1, position: "relative", background: "#0a0f1d" }}>
          <GraphCanvas
            graph={graph}
            onNodeClick={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
            activePathEdges={activePathEdges}
            compromisedNodes={compromisedNodes}
          />
          <RiskLegend />
          <AttackPanel
            result={attackResult}
            playIndex={playIndex}
            onPlayIndexChange={(fn) =>
              setPlayIndex(typeof fn === "function" ? fn : fn)
            }
            playing={playing}
            onPlayingChange={(fn) =>
              setPlaying(typeof fn === "function" ? fn : fn)
            }
            onClose={() => setAttackResult(null)}
          />
          <ChatPanel
            sessionId={sessionId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

function RiskLegend() {
  const items = [
    ["Critical", THEME.danger],
    ["High", THEME.warning],
    ["Medium", "#efd154"],
    ["Low", THEME.success],
  ];
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "rgba(17, 24, 39, 0.9)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${THEME.borderAccent}`,
        borderRadius: 6,
        padding: "8px 12px",
        display: "flex",
        gap: 16,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {items.map(([label, color]) => (
        <div
          key={label}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
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
          <span style={{ color: THEME.textMuted }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function LandingScreen({ onLoadDemo, onUpload, loading, error }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#070a13",
        backgroundImage:
          "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        textAlign: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: THEME.text,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: THEME.accent,
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Attack Surface Topology Engine
      </div>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 700,
          margin: "0 0 12px",
          maxWidth: 680,
          lineHeight: 1.2,
          letterSpacing: "-0.5px",
        }}
      >
        Trace Lateral Propagation Vector Sequences
      </h1>
      <p
        style={{
          color: THEME.textMuted,
          maxWidth: 540,
          marginBottom: 36,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Parse standard Nmap XML data to construct precise node graphs. Simulate
        realistic attacker movement and horizontal movement paths across
        segmented subnets.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <label
          style={{
            background: THEME.accent,
            color: "#ffffff",
            fontWeight: 600,
            borderRadius: 6,
            padding: "10px 18px",
            cursor: "pointer",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid transparent",
            transition: "background 0.2s",
          }}
        >
          <Icons.Upload /> Upload Nmap Scan (XML)
          <input
            type="file"
            accept=".xml"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
          />
        </label>
        <button
          onClick={onLoadDemo}
          style={{
            background: "transparent",
            border: `1px solid ${THEME.borderAccent}`,
            color: THEME.text,
            fontWeight: 600,
            borderRadius: 6,
            padding: "10px 18px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icons.Demo /> Run Simulation Demo
        </button>
      </div>

      {loading && (
        <div
          style={{ marginTop: 24, color: THEME.textMuted, fontSize: 12 }}
          className="mono"
        >
          Initializing secure environment parser...
        </div>
      )}
      {error && (
        <div
          style={{ marginTop: 24, color: THEME.danger, fontSize: 12 }}
          className="mono"
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}

const headerBtn = {
  background: "#1f2937",
  border: `1px solid ${THEME.borderAccent}`,
  color: THEME.text,
  borderRadius: 4,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};
