import React, { useEffect, useMemo, useState } from "react";
import GraphCanvas from "./components/GraphCanvas";
import DeviceSidebar from "./components/DeviceSidebar";
import AttackPanel from "./components/AttackPanel";
import ChatPanel from "./components/ChatPanel";
import Landing from "./components/Landing";
import CharacterSelect from "./components/CharacterSelect";
import UploadScreen from "./components/UploadScreen";
import Loader from "./components/Loader";
import ReportView from "./components/ReportView";
import { getPersona } from "./lib/personas";
import { api } from "./lib/api";

const Icons = {
  Logo: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--signal)"
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
  Swap: () => (
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
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  Report: () => (
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
};

export default function App() {
  // stage: 'landing' | 'select' | 'upload' | 'console'
  const [stage, setStage] = useState("landing");
  const [personaId, setPersonaId] = useState("red");
  const [sessionId, setSessionId] = useState(null);
  const [graph, setGraph] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [originalResult, setOriginalResult] = useState(null);
  const [patching, setPatching] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persona = getPersona(personaId);

  // Drive the whole app's accent color from the chosen persona via a data
  // attribute on <body> (see index.css :root / body[data-persona] tokens).
  useEffect(() => {
    document.body.setAttribute("data-persona", personaId);
  }, [personaId]);

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
      setStage("console");
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
      setStage("console");
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
      const res = await api.simulate(sessionId, nodeId, personaId);
      setAttackResult(res);
      setOriginalResult(res);
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

  async function handlePatchHop(hop) {
    if (!attackResult) return;
    setPatching(true);
    setError(null);
    try {
      const updatedGraph = await api.patchHop(sessionId, hop.from, hop.to);
      setGraph(updatedGraph);
      const verify = await api.simulate(
        sessionId,
        attackResult.start,
        personaId,
      );
      setAttackResult(verify);
      setPlayIndex(0);
      setPlaying(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setPatching(false);
    }
  }

  function resetToUpload() {
    setGraph(null);
    setSessionId(null);
    setAttackResult(null);
    setOriginalResult(null);
    setSelectedNodeId(null);
    setStage("upload");
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

  const securedNodes = useMemo(() => {
    if (!originalResult || !attackResult) return new Set();
    const currentSet = new Set(attackResult.compromised_order);
    return new Set(
      originalResult.compromised_order.filter(
        (id) => id !== originalResult.start && !currentSet.has(id),
      ),
    );
  }, [originalResult, attackResult]);

  const hasPatched = !!(
    originalResult &&
    attackResult &&
    originalResult !== attackResult
  );

  if (stage === "landing") {
    return (
      <>
        <div className="grain" />
        <Landing onEnter={() => setStage("select")} />
      </>
    );
  }

  if (stage === "select") {
    return (
      <>
        <div className="grain" />
        <CharacterSelect
          onBack={() => setStage("landing")}
          onSelect={(id) => {
            setPersonaId(id);
            setStage("upload");
          }}
        />
      </>
    );
  }

  if (stage === "upload" || !graph) {
    return (
      <>
        <div className="grain" />
        <UploadScreen
          personaId={personaId}
          onBack={() => setStage("select")}
          onLoadDemo={handleLoadDemo}
          onUpload={handleUpload}
          loading={loading}
          error={error}
        />
      </>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <div className="grain" />
      <header
        style={{
          height: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icons.Logo />
          <span
            className="display"
            style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.03em" }}
          >
            NetTwin Console
          </span>
          <div
            style={{ height: 16, width: 1, backgroundColor: "var(--border)" }}
          />
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: persona.color,
              fontWeight: 700,
              letterSpacing: "0.1em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: persona.color,
                display: "inline-block",
              }}
            />
            {persona.name.toUpperCase()} · {persona.callsign}
          </span>
          <div
            style={{ height: 16, width: 1, backgroundColor: "var(--border)" }}
          />
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            {graph.nodes.length - 1} nodes • {graph.edges.length} connections
            detected
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setReportOpen(true)}
            disabled={!attackResult}
            title={
              !attackResult ? "Run a simulation first" : "Generate a report"
            }
            style={{
              ...headerBtn,
              opacity: attackResult ? 1 : 0.4,
              cursor: attackResult ? "pointer" : "default",
            }}
          >
            <Icons.Report /> Generate Report
          </button>
          <button onClick={() => setChatOpen((v) => !v)} style={headerBtn}>
            <Icons.Chat /> Ask {persona.name}
          </button>
          <button onClick={() => setStage("select")} style={headerBtn}>
            <Icons.Swap /> Change Attacker
          </button>
          <button onClick={resetToUpload} style={headerBtn}>
            <Icons.Refresh /> Reset Session
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 320,
            borderRight: "1px solid var(--border)",
            background: "var(--panel)",
          }}
        >
          <DeviceSidebar
            node={selectedNode}
            onSimulate={handleSimulate}
            onIsolate={handleIsolate}
            personaColor={persona.color}
          />
        </div>

        <div style={{ flex: 1, position: "relative", background: "#070a11" }}>
          <GraphCanvas
            graph={graph}
            onNodeClick={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
            activePathEdges={activePathEdges}
            compromisedNodes={compromisedNodes}
            securedNodes={securedNodes}
            personaColor={persona.color}
          />
          <RiskLegend />
          <AttackPanel
            result={attackResult}
            originalResult={originalResult}
            playIndex={playIndex}
            onPlayIndexChange={(fn) =>
              setPlayIndex(typeof fn === "function" ? fn : fn)
            }
            playing={playing}
            onPlayingChange={(fn) =>
              setPlaying(typeof fn === "function" ? fn : fn)
            }
            onClose={() => {
              setAttackResult(null);
              setOriginalResult(null);
            }}
            onPatchHop={handlePatchHop}
            patching={patching}
            hasPatched={hasPatched}
            personaColor={persona.color}
          />
          <ChatPanel
            sessionId={sessionId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            persona={persona}
          />
          <ReportView
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            sessionId={sessionId}
            persona={persona}
            attackResult={attackResult}
            originalResult={originalResult}
            hasPatched={hasPatched}
          />
          {loading && !attackResult && (
            <Loader
              fullscreen
              color={persona.color}
              messages={["Re-scoring exposure…", "Applying scenario…"]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RiskLegend() {
  const items = [
    ["Critical", "#ef4444"],
    ["High", "#f59e0b"],
    ["Medium", "#efd154"],
    ["Low", "#10b981"],
    ["Secured", "#10b981"],
  ];
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "rgba(13, 17, 25, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--border)",
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
          <span style={{ color: "var(--text-muted)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

const headerBtn = {
  background: "var(--panel-2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 4,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};
