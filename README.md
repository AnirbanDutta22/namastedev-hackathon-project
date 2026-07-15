# NetTwin AI — AI-Powered Network Attack Path Simulator

Upload a network scan. Watch an AI reason, step by step, about how an attacker
would move through your infrastructure — before they do.

**Problem:** Network diagrams show what your infra looks like. Vuln scanners
show what's broken. Nobody answers "if this one machine gets popped today,
what happens next?" Security engineers currently do that analysis by hand.

**What NetTwin AI does:** Parses an Nmap scan into a live network graph,
lets you click any node and simulate a compromise from there, and uses an
LLM to narrate each hop of the attack in plain English with a MITRE ATT&CK
stage and a concrete remediation — plus a chat assistant that answers
free-form questions grounded in your actual graph.

## Quick start (local)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optionally add OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL if backend isn't on localhost:8000
npm run dev
```

Open http://localhost:5173, click **"Try demo network"**, click any node,
hit **"Simulate compromise from here"**, then try **Ask AI**.

## How it works

1. **Parser** (`backend/app/parsers/nmap_parser.py`) — turns Nmap XML into
   typed nodes (Web Server, API Server, Database, Redis, …) with risk scores,
   and infers edges via two transparent heuristics: internet-facing exposure
   (open web/remote ports) and same-subnet lateral movement.
2. **Graph engine** (`backend/app/models/graph_engine.py`) — NetworkX
   DiGraph. `simulate_attack()` does a risk-prioritized BFS from a chosen
   start node. `apply_scenario()` supports what-if mutations (block a port,
   isolate a node) for live re-simulation.
3. **AI agent** (`backend/app/agents/ai_agent.py`) — one prompt turns the
   raw hop list into plain-English explanations + MITRE stage +
   remediation + estimated risk reduction; a second prompt answers free-form
   questions grounded in a serialized graph context. **No API key set →
   deterministic fallback narration**, so the live demo never breaks even
   offline.
4. **Frontend** (`frontend/src/`) — React Flow graph with risk-colored
   nodes, animated attack-path playback panel, device inspector sidebar,
   and a Q&A chat panel.

## Deploying

- **Backend:** Dockerfile included. Push to Render / Railway / Fly.io as a
  Docker web service. Set `OPENAI_API_KEY` as an env var there.
- **Frontend:** `npm run build` → deploy `dist/` to Vercel/Netlify, or serve
  as a static site anywhere. Set `VITE_API_URL` to your deployed backend URL.

## What's intentionally out of scope for this build

Multi-format parsers (AWS/Azure/Terraform/K8s/Cisco), PDF report export,
"Time Travel" snapshots, live SIEM integration. See
`docs/CONTINUATION_GUIDE.md` for exactly how to add these next.
