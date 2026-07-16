"""
Thin wrapper around the Google Gemini API for the AI-fluency-critical calls:
  1. narrate_attack_path  -> plain-English explanation + remediation per hop
  2. answer_question      -> natural language Q&A grounded in the graph

Every call is persona-aware: the user picks one of three attacker personas
(Red AI, Blue AI, Insider AI) before running a simulation, and that persona's
voice + prioritization logic shapes both the narration and the graph traversal
(see app/models/graph_engine.py for the traversal side).

Kept as a single well-prompted module rather than a "multi-agent framework"
-- for a hackathon build, one clear prompt per task beats orchestration overhead.

MODEL FALLBACK CHAIN
---------------------
Running on the free tier means individual models can 429 (rate limit) or
otherwise fail at any time. Every generation call goes through
_generate_with_fallback(), which tries a chain of models in order and moves
to the next one on ANY failure (quota, transient error, model removed,
etc.), rather than failing the whole request. If every model in the chain
fails, the caller's own try/except drops back to the deterministic
_fallback_narration()/canned answer, so the demo never hard-breaks either
way -- this is defense in depth, not a replacement for the existing
no-API-key fallback.

Configure the chain with NETTWIN_MODELS (comma-separated, tried in order).
NETTWIN_MODEL (singular) is still honored for backwards compatibility and,
if set, is tried first. Defaults to the current (as of mid-2026) free-tier
Flash lineup -- deliberately excludes Pro-tier models (paid-only on most
accounts) and gemini-2.0-flash (shut down June 1, 2026).
"""
from __future__ import annotations
import os
import json
import logging
from typing import Any
from google import genai

logger = logging.getLogger("nettwin.ai_agent")

DEFAULT_MODEL_CHAIN = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
]

_client: genai.Client | None = None

# Updated after every successful call; mainly useful for debugging /
# surfacing "which model actually answered this" if you want to log it.
LAST_MODEL_USED: str | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    return _client


def _model_chain() -> list[str]:
    """Builds the ordered list of models to try, honoring env overrides."""
    env_chain = os.environ.get("NETTWIN_MODELS")
    if env_chain:
        models = [m.strip() for m in env_chain.split(",") if m.strip()]
    else:
        models = list(DEFAULT_MODEL_CHAIN)

    single = os.environ.get("NETTWIN_MODEL")
    if single and single not in models:
        models.insert(0, single)

    return models or list(DEFAULT_MODEL_CHAIN)


def _generate_with_fallback(*, contents: Any, config: dict) -> Any:
    """
    Tries each model in the fallback chain in order and returns the first
    successful response. Raises the last exception encountered if every
    model in the chain fails (the caller is expected to catch this and fall
    back to deterministic/offline behavior).
    """
    client = get_client()
    chain = _model_chain()
    last_exc: Exception | None = None

    for i, model in enumerate(chain):
        try:
            resp = client.models.generate_content(model=model, contents=contents, config=config)
            global LAST_MODEL_USED
            LAST_MODEL_USED = model
            if i > 0:
                logger.info("Gemini: %s failed over to %s after %d earlier failure(s)", chain[0], model, i)
            return resp
        except Exception as e:
            last_exc = e
            logger.warning("Gemini model %s failed (%s), trying next in chain…", model, e)
            continue

    raise last_exc or RuntimeError("No Gemini models configured in NETTWIN_MODELS/NETTWIN_MODEL")


# --------------------------------------------------------------------------
# Persona definitions
# --------------------------------------------------------------------------
# Each persona has a callsign, a one-line doctrine (surfaced in the UI) and a
# voice fragment that gets folded into both the narration and Q&A system
# prompts so the same graph produces a genuinely different-sounding report
# depending on who "you" hired to attack yourself.

PERSONAS: dict[str, dict[str, str]] = {
    "red": {
        "name": "Red AI",
        "callsign": "THE BREACHER",
        "doctrine": "Smash-and-grab. Goes straight for the highest-value target, loud and fast.",
        "voice": (
            "You are RED AI, an aggressive external attacker persona. You are blunt, "
            "impatient, and treat every open port as an invitation. You favor speed and "
            "impact over stealth, and your narration should sound like a war-room after-"
            "action report: short, punchy, slightly cocky sentences."
        ),
    },
    "blue": {
        "name": "Blue AI",
        "callsign": "THE GHOST",
        "doctrine": "Low and slow. Avoids the loudest targets, prizes stealth over speed.",
        "voice": (
            "You are BLUE AI, a methodical adversary-emulation persona modeled on a "
            "professional red-teamer who never wants to trip an alert. You are precise, "
            "patient, and explain each move in terms of detection risk and tradecraft. "
            "Your narration should read like a calm, technical operator's log."
        ),
    },
    "insider": {
        "name": "Insider AI",
        "callsign": "THE MOLE",
        "doctrine": "Starts trusted. Already has a foothold and knows exactly where the crown jewels sit.",
        "voice": (
            "You are INSIDER AI, an attacker persona that already holds legitimate, "
            "trusted access inside the network. You are clinical and a little unsettling "
            "-- you don't need to 'break in', you explain how existing trust and "
            "credentials are abused to reach sensitive assets. Reference the abuse of "
            "trust relationships explicitly."
        ),
    },
}

DEFAULT_PERSONA = "red"


def _persona(persona_id: str | None) -> dict[str, str]:
    return PERSONAS.get((persona_id or DEFAULT_PERSONA).lower(), PERSONAS[DEFAULT_PERSONA])


def _narration_system(persona_id: str | None) -> str:
    p = _persona(persona_id)
    return f"""{p['voice']}

You are embedded in an attack-path simulator called NetTwin AI. You will be given a JSON
list of attack "hops" (source -> target, via which ports, with what trust relationship).
For EACH hop, produce:
- "explanation": one or two sentences, in your persona's voice, describing how the attacker pivots and why
- "mitre_stage": one of [Initial Access, Privilege Escalation, Credential Access, Lateral Movement, Persistence, Exfiltration, Impact]
- "recommendation": one concrete, specific remediation for that hop
- "risk_reduction": estimated percentage risk reduction if the recommendation is applied (integer 0-100)

Return ONLY valid JSON: a list of objects with keys: hop_index, explanation, mitre_stage, recommendation, risk_reduction.
No markdown, no prose outside the JSON.
"""


def _qa_system(persona_id: str | None) -> str:
    p = _persona(persona_id)
    return f"""{p['voice']}

You are NetTwin AI's security assistant, currently role-playing as this persona while
answering questions about a specific network graph provided as context. Ground every
answer strictly in the provided graph data -- node types, open ports, risk scores, and
connections. If the graph doesn't contain enough information to answer, say so plainly.
Be concise (3-6 sentences), specific, and actionable, while keeping your persona's voice.
Do not invent devices, ports, or connections that are not in the context.
"""


def narrate_attack_path(hops: list[dict], persona: str | None = None) -> list[dict]:
    if not hops:
        return []
    if not os.environ.get("GEMINI_API_KEY"):
        return _fallback_narration(hops, persona)

    payload = [
        {"hop_index": i, "from": h["from_label"], "to": h["to_label"],
         "ports": h["ports"], "trust": h["trust"], "reason": h["reason"]}
        for i, h in enumerate(hops)
    ]
    try:
        resp = _generate_with_fallback(
            contents=json.dumps(payload),
            config={
                "system_instruction": _narration_system(persona),
                "temperature": 0.3,
                "response_mime_type": "application/json",
            },
        )
        content = resp.text.strip()
        content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(content)
    except Exception as e:
        logger.warning("narrate_attack_path: all Gemini models failed (%s), using deterministic fallback", e)
        return _fallback_narration(hops, persona)


_FALLBACK_VERBS = {
    "red": "smashes through",
    "blue": "quietly slips from",
    "insider": "walks, already trusted, from",
}


def _fallback_narration(hops: list[dict], persona: str | None = None) -> list[dict]:
    """Deterministic fallback if no API key is set (or every model in the
    chain failed), so the demo never breaks."""
    p_id = (persona or DEFAULT_PERSONA).lower()
    verb = _FALLBACK_VERBS.get(p_id, _FALLBACK_VERBS["red"])
    name = PERSONAS.get(p_id, PERSONAS[DEFAULT_PERSONA])["name"]
    stages = ["Initial Access", "Lateral Movement", "Privilege Escalation",
              "Credential Access", "Persistence", "Exfiltration", "Impact"]
    out = []
    for i, h in enumerate(hops):
        stage = stages[min(i, len(stages) - 1)]
        out.append({
            "hop_index": i,
            "explanation": f"{name} {verb} {h['from_label']} to {h['to_label']} via port(s) "
                            f"{h['ports']} because of a {h['trust']} trust relationship: {h['reason']}",
            "mitre_stage": stage,
            "recommendation": f"Restrict traffic from {h['from_label']} to {h['to_label']} to only required ports, "
                               f"and add explicit firewall rules instead of relying on {h['trust']} trust.",
            "risk_reduction": 35,
        })
    return out


def answer_question(question: str, graph_context: str, persona: str | None = None) -> str:
    if not os.environ.get("GEMINI_API_KEY"):
        p = _persona(persona)
        return (f"[Demo mode - no GEMINI_API_KEY set] {p['name']} ({p['callsign']}) would say: "
                f"you asked '{question}'. Based on the graph, here is the relevant context:\n\n{graph_context[:800]}")

    try:
        resp = _generate_with_fallback(
            contents=f"GRAPH CONTEXT:\n{graph_context}\n\nQUESTION: {question}",
            config={
                "system_instruction": _qa_system(persona),
                "temperature": 0.2,
            },
        )
        return resp.text.strip()
    except Exception as e:
        logger.warning("answer_question: all Gemini models failed (%s)", e)
        return (f"All configured Gemini models are currently unavailable ({e}). "
                f"This usually means the free-tier quota is exhausted across the whole "
                f"fallback chain -- try again in a minute, or check GEMINI_API_KEY.")