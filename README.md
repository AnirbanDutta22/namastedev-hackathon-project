# PentestAI

**Upload a network scan. Pick an attacker. Watch it think — then prove your fix actually works.**

PentestAI parses a real Nmap scan into a live attack-path graph, lets you choose between three AI attacker personas with genuinely different doctrines, and narrates a step-by-step compromise in that persona's voice — mapped to MITRE ATT&CK, with a concrete fix for every hop. Then it does the thing most tools don't: you click **Patch This Hop & Re-Verify**, and it re-runs the same attacker against your fix, live, so you watch the blast radius shrink instead of taking the recommendation on faith.

---

## The problem

Network diagrams show what your infrastructure looks like. Vulnerability scanners show what's broken. Neither answers the question a security engineer actually asks: *"If this one machine gets popped today, what happens next — and does my proposed fix actually stop it?"*

That analysis is normally done by hand, by an expensive human, one what-if at a time. PentestAI automates the reasoning and makes the verification loop instant.

## What it does

1. **Parses** an Nmap XML scan into a typed network graph — servers, databases, workstations — with risk-scored nodes and inferred trust edges (internet exposure + same-subnet lateral movement).
2. **Simulates a compromise** from any node, using one of three attacker personas, each with a different traversal doctrine over the *same* graph.
3. **Narrates every hop** in that persona's voice via Gemini — plain-English explanation, MITRE ATT&CK stage, and a specific remediation, with a graceful offline fallback if no API key is set.
4. **Closes the loop**: patch the recommended hop and re-simulate instantly. Watch nodes flip from compromised (glowing, persona-colored) to secured (green shield) in real time. If a patch doesn't reduce the blast radius, the tool tells you honestly — that's not where your real exposure was.
5. **Answers free-form questions** about the network through a persona-voiced chat assistant, grounded strictly in the actual graph.

## Key features

| Feature | Detail |
|---|---|
| **Three attacker personas** | **Red AI** ("The Breacher") — smash-and-grab, highest-risk target first. **Blue AI** ("The Ghost") — stealthy, lowest-risk-first, avoids tripping alerts. **Insider AI** ("The Mole") — starts trusted, goes straight for the highest-criticality asset. Same graph, three different attack orders and three different voices. |
| **Attack → Patch → Re-Verify loop** | Every AI recommendation is a button, not just text. Patch it, and the graph is re-simulated live against the same attacker. |
| **MITRE ATT&CK mapping** | Every hop is tagged with a real technique stage (Initial Access, Lateral Movement, Credential Access, etc.). |
| **Multi-model AI fallback chain** | Gemini calls cascade across a configurable chain of free-tier models, so a single rate-limited model doesn't break the demo. Falls back to deterministic narration if every model (or no API key) is unavailable. |
| **Persona-grounded chat** | Ask anything about the network; answers are grounded in the actual graph and delivered in the active persona's voice. |
| **Animated, non-generic UI** | Custom landing page, character-select screen, HUD-styled console, glowing risk-colored nodes, and a loading state that surfaces rotating security trivia instead of a blank spinner. |

## How it works

```
Nmap XML  →  Parser  →  Typed Graph  →  Persona-Aware Traversal  →  AI Narration  →  Interactive Console
              (nmap_parser.py)  (graph_engine.py)  (graph_engine.py)  (ai_agent.py)   (React / React Flow)
```

1. **`backend/app/parsers/nmap_parser.py`** — Nmap only reports hosts, not who talks to whom, so edges are *inferred* with a transparent heuristic: a host with a server-ish open port is reachable from the internet; hosts sharing a `/24` subnet can reach each other, but only *upward* through a rough asset-value tier (workstation → app server → data store), never back down. This keeps the graph from degenerating into an unrealistic flat mesh and means a single well-chosen patch can genuinely close off a branch.
2. **`backend/app/models/graph_engine.py`** — a NetworkX `DiGraph`. `simulate_attack()` runs a risk-prioritized BFS whose sort order depends on the active persona's doctrine. `apply_scenario()` supports live what-if mutations — block a port, isolate a node, or `patch_hop` a specific edge — which is what powers the re-verify loop.
3. **`backend/app/agents/ai_agent.py`** — every hop list and every chat question goes through Gemini with a persona-specific system prompt, and every call is tried across a fallback chain of models before giving up.
4. **`frontend/src/`** — React + React Flow. Landing page → character select → upload/demo → console, with the graph canvas, attack-path playback panel, device inspector, and chat modal all live-themed off the selected persona's color.

## Tech stack

- **Backend:** FastAPI, NetworkX, Google Gemini (`google-genai`)
- **Frontend:** React 18, React Flow, Vite — no CSS framework, hand-built design system
- **Deploy target:** Docker (backend) + static hosting (frontend build)

## Quick start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optionally add GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | No | Enables live AI narration/chat. Without it, PentestAI runs in deterministic offline demo mode — the app never breaks, it just narrates with canned (but still persona-accurate) text. |
| `NETTWIN_MODELS` | No | Comma-separated fallback chain of Gemini models, tried in order. Defaults to a current free-tier Flash lineup. |
| `NETTWIN_MODEL` | No | Pins a single model to the front of the fallback chain. |

## Demo script (using the built-in demo network)

This is the 60-second version worth running for judges:

1. Load the demo network, select the **Internet** node, run **Red AI**. It reaches all 6 hosts.
2. On the first hop's recommendation, click **Patch This Hop & Re-Verify**. That one fix — closing the single gateway server's public exposure — was the sole entry point into the whole internal network: **5 assets flip to Secured instantly.**
3. One host remains reachable: an RDP box sitting on its own forgotten subnet — a classic shadow-IT finding. Patch that hop too → **full containment.**
4. Reset and re-run with **Blue AI** or **Insider AI** on the same network to show the attack order — and the AI's narration voice — genuinely change.

## Deploying

- **Backend:** `Dockerfile` included. Deploy to Render/Railway/Fly.io as a Docker web service; set `GEMINI_API_KEY` as an env var. `render.yaml` is preconfigured.
- **Frontend:** `npm run build` → deploy the `dist/` folder to Vercel/Netlify/any static host. Set `VITE_API_URL` to your deployed backend URL.

## Project structure

```
backend/
  app/
    parsers/nmap_parser.py     # Nmap XML -> typed graph
    models/graph_engine.py     # traversal, persona doctrines, patch/re-verify
    agents/ai_agent.py         # Gemini narration + chat, multi-model fallback
    main.py                    # FastAPI routes
    sample_data/demo_scan.xml  # curated demo network
frontend/
  src/
    components/                # Landing, CharacterSelect, UploadScreen,
                                # GraphCanvas, AttackPanel, ChatPanel, Loader
    lib/                       # API client, persona metadata
```
