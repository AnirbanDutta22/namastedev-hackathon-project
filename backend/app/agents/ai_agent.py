"""
Thin wrapper around the OpenAI API for the three AI-fluency-critical calls:
  1. narrate_attack_path  -> plain-English explanation + remediation per hop
  2. answer_question      -> natural language Q&A grounded in the graph
  3. summarize_report     -> executive summary text for export

Kept as a single well-prompted module rather than a "multi-agent framework"
-- for a 4-day build, one clear prompt per task beats orchestration overhead.
"""
from __future__ import annotations
import os
import json
from openai import OpenAI

MODEL = os.environ.get("NETTWIN_MODEL", "gpt-4o-mini")
_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


NARRATION_SYSTEM = """You are a network security analyst AI embedded in an attack-path
simulator called NetTwin AI. You will be given a JSON list of attack "hops" (source -> target,
via which ports, with what trust relationship). For EACH hop, produce:
- "explanation": one or two plain-English sentences describing how the attacker pivots and why
- "mitre_stage": one of [Initial Access, Privilege Escalation, Credential Access, Lateral Movement, Persistence, Exfiltration, Impact]
- "recommendation": one concrete, specific remediation for that hop
- "risk_reduction": estimated percentage risk reduction if the recommendation is applied (integer 0-100)

Return ONLY valid JSON: a list of objects with keys: hop_index, explanation, mitre_stage, recommendation, risk_reduction.
No markdown, no prose outside the JSON.
"""

QA_SYSTEM = """You are NetTwin AI's security assistant. You answer questions about a specific
network graph that will be provided as context. Ground every answer strictly in the provided
graph data — node types, open ports, risk scores, and connections. If the graph doesn't contain
enough information to answer, say so plainly. Be concise (3-6 sentences), specific, and actionable.
Do not invent devices, ports, or connections that are not in the context.
"""


def narrate_attack_path(hops: list[dict]) -> list[dict]:
    if not hops:
        return []
    if not os.environ.get("OPENAI_API_KEY"):
        return _fallback_narration(hops)

    client = get_client()
    payload = [
        {"hop_index": i, "from": h["from_label"], "to": h["to_label"],
         "ports": h["ports"], "trust": h["trust"], "reason": h["reason"]}
        for i, h in enumerate(hops)
    ]
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": NARRATION_SYSTEM},
            {"role": "user", "content": json.dumps(payload)},
        ],
        temperature=0.3,
    )
    try:
        content = resp.choices[0].message.content.strip()
        content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(content)
    except Exception:
        return _fallback_narration(hops)


def _fallback_narration(hops: list[dict]) -> list[dict]:
    """Deterministic fallback if no API key is set, so the demo never breaks."""
    stages = ["Initial Access", "Lateral Movement", "Privilege Escalation",
              "Credential Access", "Persistence", "Exfiltration", "Impact"]
    out = []
    for i, h in enumerate(hops):
        stage = stages[min(i, len(stages) - 1)]
        out.append({
            "hop_index": i,
            "explanation": f"Attacker pivots from {h['from_label']} to {h['to_label']} via port(s) "
                            f"{h['ports']} because of a {h['trust']} trust relationship: {h['reason']}",
            "mitre_stage": stage,
            "recommendation": f"Restrict traffic from {h['from_label']} to {h['to_label']} to only required ports, "
                               f"and add explicit firewall rules instead of relying on {h['trust']} trust.",
            "risk_reduction": 35,
        })
    return out


def answer_question(question: str, graph_context: str) -> str:
    if not os.environ.get("OPENAI_API_KEY"):
        return (f"[Demo mode - no API key set] You asked: '{question}'. "
                f"Based on the graph, here is the relevant context:\n\n{graph_context[:800]}")

    client = get_client()
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": QA_SYSTEM},
            {"role": "user", "content": f"GRAPH CONTEXT:\n{graph_context}\n\nQUESTION: {question}"},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content.strip()
