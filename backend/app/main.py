from __future__ import annotations
import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from app.parsers.nmap_parser import parse_nmap_xml
from app.models.graph_engine import NetworkGraph
from app.agents.ai_agent import narrate_attack_path, answer_question, PERSONAS
from app.reports.report_builder import build_report

origins = [
    "https://pentestai-frontend-h4yu.onrender.com",
    "http://localhost:5173",
]

load_dotenv()

app = FastAPI(title="Pentest AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store: {session_id: NetworkGraph}. Fine for a hackathon demo.
SESSIONS: dict[str, NetworkGraph] = {}


def _demo_graph_data() -> dict:
    here = os.path.dirname(__file__)
    sample_path = os.path.join(here, "sample_data", "demo_scan.xml")
    with open(sample_path) as f:
        return parse_nmap_xml(f.read())


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/personas")
def personas():
    return {"personas": [{"id": k, **v} for k, v in PERSONAS.items()]}


@app.post("/api/upload")
async def upload_scan(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="ignore")
    try:
        parsed = parse_nmap_xml(content)
    except Exception as e:
        raise HTTPException(400, f"Could not parse Nmap XML: {e}")
    if not parsed["nodes"]:
        raise HTTPException(400, "No live hosts found in scan.")

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = NetworkGraph(parsed["nodes"], parsed["edges"])
    return {"session_id": session_id, "graph": SESSIONS[session_id].to_dict()}


@app.post("/api/demo")
def load_demo():
    """Loads a pre-baked sample network so the demo never fails on stage."""
    parsed = _demo_graph_data()
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = NetworkGraph(parsed["nodes"], parsed["edges"])
    return {"session_id": session_id, "graph": SESSIONS[session_id].to_dict()}


def _get_graph(session_id: str) -> NetworkGraph:
    graph = SESSIONS.get(session_id)
    if graph is None:
        raise HTTPException(404, "Session not found. Upload a scan or load the demo first.")
    return graph


@app.get("/api/graph/{session_id}")
def get_graph(session_id: str):
    return _get_graph(session_id).to_dict()


@app.post("/api/simulate/{session_id}")
def simulate(session_id: str, body: dict):
    graph = _get_graph(session_id)
    start_node = body.get("start_node")
    persona = body.get("persona", "red")
    if not start_node:
        raise HTTPException(400, "start_node is required")
    result = graph.simulate_attack(start_node, persona=persona)
    result["persona"] = persona
    narration = narrate_attack_path(result["hops"], persona=persona)
    for hop, note in zip(result["hops"], narration):
        hop.update({
            "explanation": note.get("explanation"),
            "mitre_stage": note.get("mitre_stage"),
            "recommendation": note.get("recommendation"),
            "risk_reduction": note.get("risk_reduction"),
        })
    return result


class ScenarioRequest(BaseModel):
    action: str  # block_port | isolate_node | remove_node | patch_hop
    params: dict


@app.post("/api/scenario/{session_id}")
def scenario(session_id: str, req: ScenarioRequest):
    graph = _get_graph(session_id)
    graph.apply_scenario(req.action, req.params)
    return graph.to_dict()


class AskRequest(BaseModel):
    question: str
    persona: str = "red"


@app.post("/api/ask/{session_id}")
def ask(session_id: str, req: AskRequest):
    graph = _get_graph(session_id)
    context = graph.context_for_llm()
    answer = answer_question(req.question, context, persona=req.persona)
    return {"answer": answer}


class ReportRequest(BaseModel):
    persona: str = "red"
    attack_result: dict | None = None
    original_result: dict | None = None
    patched: bool = False
    network_name: str = "Uploaded Network"


@app.post("/api/report/{session_id}")
def report(session_id: str, req: ReportRequest):
    """
    Builds a board-ready report from the graph's current state plus whatever
    attack result the frontend currently has on screen. The frontend passes
    attack_result/original_result/patched straight from its own state so the
    report always matches exactly what the user is looking at.
    """
    graph = _get_graph(session_id)
    persona_meta = PERSONAS.get(req.persona.lower(), PERSONAS["red"])
    return build_report(
        graph.to_dict(),
        req.attack_result,
        req.original_result,
        req.patched,
        {"id": req.persona, "name": persona_meta["name"],
         "callsign": persona_meta["callsign"], "doctrine": persona_meta["doctrine"]},
        req.network_name,
    )